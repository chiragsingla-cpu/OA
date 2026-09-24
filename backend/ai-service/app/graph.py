"""LangGraph pipeline: classify → (retrieve → generate) | decline."""

from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from app import llm, vectorstore
from app.config import settings
from app.embeddings import embed_query

ANSWERABLE = {"general_docs", "onboarding"}

DECLINE_MESSAGES = {
    "out_of_scope": (
        "I can only help with company topics such as HR policies, the employee handbook, "
        "onboarding and project documents. Is there something along those lines I can help with?"
    ),
    "account_specific": (
        "That question needs your personal records, which I don't have access to. "
        "Please contact HR or your administrator for details about your own account."
    ),
}

NO_DOCUMENTS_ANSWER = (
    "I couldn't find anything about that in the documents available to you. "
    "Please contact HR or an administrator."
)


class ChatState(TypedDict, total=False):
    question: str
    role: str
    history: list[dict]
    category: str
    standalone_question: str
    chunks: list[dict]
    answer: str
    sources: list[dict]


def classify_node(state: ChatState) -> ChatState:
    result = llm.classify(state["question"], state.get("history", []))
    return {
        "category": result.category,
        "standalone_question": result.standalone_question.strip() or state["question"],
    }


def route_after_classify(state: ChatState) -> str:
    return "retrieve" if state["category"] in ANSWERABLE else "decline"


def decline_node(state: ChatState) -> ChatState:
    return {"answer": DECLINE_MESSAGES[state["category"]], "sources": [], "chunks": []}


def retrieve_node(state: ChatState) -> ChatState:
    query_vector = embed_query(state["standalone_question"])
    chunks = vectorstore.search(query_vector, role=state["role"], limit=settings.retrieval_top_k)
    return {"chunks": chunks}


def generate_node(state: ChatState) -> ChatState:
    chunks = state.get("chunks", [])
    if not chunks:
        return {"answer": NO_DOCUMENTS_ANSWER, "sources": []}

    answer = llm.answer(state["standalone_question"], state.get("history", []), chunks)

    sources: dict[str, dict] = {}
    for chunk in chunks:
        sources.setdefault(chunk["document_id"], {"document_id": chunk["document_id"], "title": chunk["title"]})
    return {"answer": answer, "sources": list(sources.values())}


def build_graph():
    graph = StateGraph(ChatState)
    graph.add_node("classify", classify_node)
    graph.add_node("decline", decline_node)
    graph.add_node("retrieve", retrieve_node)
    graph.add_node("generate", generate_node)

    graph.add_edge(START, "classify")
    graph.add_conditional_edges("classify", route_after_classify, {"retrieve": "retrieve", "decline": "decline"})
    graph.add_edge("retrieve", "generate")
    graph.add_edge("generate", END)
    graph.add_edge("decline", END)
    return graph.compile()


chat_graph = build_graph()


def run_chat(question: str, role: str, history: list[dict]) -> ChatState:
    return chat_graph.invoke(
        {"question": question, "role": role, "history": history[-settings.history_limit :]}
    )
