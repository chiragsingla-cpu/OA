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


@pytest.mark.parametrize("category", ["out_of_scope", "account_specific"])
def test_declined_categories_skip_retrieval_and_llm_answer(monkeypatch, fakes, category):
    set_category(monkeypatch, category)

    result = graph.run_chat("What's the weather?", role="employee", history=[])

    assert result["category"] == category
    assert result["answer"] == graph.DECLINE_MESSAGES[category]
    assert fakes["search_roles"] == []
    assert fakes["answer_questions"] == []


def test_no_accessible_chunks_returns_not_found_without_llm(monkeypatch, fakes):
    set_category(monkeypatch, "general_docs")
    monkeypatch.setattr(graph.vectorstore, "search", lambda query_vector, role, limit: [])

    result = graph.run_chat("What are the salary bands?", role="employee", history=[])

    assert result["answer"] == graph.NO_DOCUMENTS_ANSWER
    assert result["sources"] == []
    assert fakes["answer_questions"] == []
