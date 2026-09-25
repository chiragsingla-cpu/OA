"""Graph routing tests. Claude, embeddings and MongoDB are replaced with fakes."""

import pytest

from app import graph
from app.llm import Classification

LEAVE_CHUNK = {
    "document_id": "doc-leave",
    "title": "Leave Policy",
    "category": "hr_policy",
    "text": "Employees get 24 days of annual leave.",
    "score": 0.9,
}


@pytest.fixture
def fakes(monkeypatch):
    calls = {"search_roles": [], "answer_questions": []}

    def fake_search(query_vector, role, limit):
        calls["search_roles"].append(role)
        return [LEAVE_CHUNK, {**LEAVE_CHUNK, "text": "Up to 5 days carry over."}]

    def fake_answer(question, history, chunks):
        calls["answer_questions"].append(question)
        return "You get 24 days. (Source: Leave Policy)"

    monkeypatch.setattr(graph, "embed_query", lambda text: [0.0] * 384)
    monkeypatch.setattr(graph.vectorstore, "search", fake_search)
    monkeypatch.setattr(graph.llm, "answer", fake_answer)
    return calls


def set_category(monkeypatch, category, standalone="How many leave days do I get?"):
    monkeypatch.setattr(
        graph.llm,
        "classify",
        lambda question, history: Classification(category=category, standalone_question=standalone),
    )


def test_docs_question_retrieves_with_callers_role_and_dedupes_sources(monkeypatch, fakes):
    set_category(monkeypatch, "general_docs")

    result = graph.run_chat("How many leave days?", role="employee", history=[])

    assert fakes["search_roles"] == ["employee"]
    assert result["answer"].startswith("You get 24 days")
    assert result["sources"] == [{"document_id": "doc-leave", "title": "Leave Policy"}]


def test_follow_up_uses_standalone_question(monkeypatch, fakes):
    set_category(monkeypatch, "general_docs", standalone="Can annual leave be carried over?")

    graph.run_chat("and can I carry them over?", role="employee", history=[])

    assert fakes["answer_questions"] == ["Can annual leave be carried over?"]


def test_account_specific_skips_retrieval_and_llm_answer(monkeypatch, fakes):
    set_category(monkeypatch, "account_specific")

    result = graph.run_chat("What's my leave balance?", role="employee", history=[])

    assert result["category"] == "account_specific"
    assert result["answer"] == graph.DECLINE_MESSAGES["account_specific"]
    assert fakes["search_roles"] == []
    assert fakes["answer_questions"] == []


def test_out_of_scope_with_weak_matches_is_declined(monkeypatch, fakes):
    set_category(monkeypatch, "out_of_scope", standalone="What's the weather?")
    weak = {**LEAVE_CHUNK, "score": graph.settings.out_of_scope_rescue_score - 0.05}
    monkeypatch.setattr(graph.vectorstore, "search", lambda query_vector, role, limit: [weak])

    result = graph.run_chat("What's the weather?", role="employee", history=[])

    assert result["category"] == "out_of_scope"
    assert result["answer"] == graph.DECLINE_MESSAGES["out_of_scope"]
    assert result["sources"] == []
    assert fakes["answer_questions"] == []


def test_out_of_scope_with_strong_match_is_answered_from_relevant_chunks(monkeypatch, fakes):
    set_category(monkeypatch, "out_of_scope", standalone="Tell me about the Bhaiyaa app")
    threshold = graph.settings.out_of_scope_rescue_score
    strong = {**LEAVE_CHUNK, "document_id": "doc-frd", "title": "FRD", "score": threshold + 0.03}
    weak = {**LEAVE_CHUNK, "score": threshold - 0.05}
    monkeypatch.setattr(graph.vectorstore, "search", lambda query_vector, role, limit: [strong, weak])

    result = graph.run_chat("bhaiyaa app", role="employee", history=[])

    assert result["category"] == "general_docs"
    assert fakes["answer_questions"] == ["Tell me about the Bhaiyaa app"]
    assert result["sources"] == [{"document_id": "doc-frd", "title": "FRD"}]


def test_no_accessible_chunks_returns_not_found_without_llm(monkeypatch, fakes):
    set_category(monkeypatch, "general_docs")
    monkeypatch.setattr(graph.vectorstore, "search", lambda query_vector, role, limit: [])

    result = graph.run_chat("What are the salary bands?", role="employee", history=[])

    assert result["answer"] == graph.NO_DOCUMENTS_ANSWER
    assert result["sources"] == []
    assert fakes["answer_questions"] == []
