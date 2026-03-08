from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from langchain_ollama import OllamaLLM
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
import os

# Ensure the DB directory exists
PERSIST_DIRECTORY = "chroma_db"
if not os.path.exists(PERSIST_DIRECTORY):
    os.makedirs(PERSIST_DIRECTORY)

# Lazy-loaded Embeddings to prevent startup hangs
_embeddings = None
_llm = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        try:
            print("🧠 Initializing Neural Embeddings (Local MiniLM)...")
            from langchain_huggingface import HuggingFaceEmbeddings
            _embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
        except Exception as e:
            print(f"⚠️ Embedding Initialization Warning: {e}. AI features might be limited.")
            return None
    return _embeddings

# Smart LLM Selector: Local Ollama ONLY
def get_llm():
    global _llm
    if _llm is not None:
        return _llm
    
    try:
        # ATTEMPT LOCAL OLLAMA (Strictly Local AI Fundamentals)
        print("DEBUG: Probing Local Llama Node (Ollama)...")
        from langchain_ollama import OllamaLLM
        # Defaulting to llama3 or phi3 depending on local setup
        llm_local = OllamaLLM(model="phi3", temperature=0.1, timeout=5)
        
        # Test the connection to ensure it's alive
        llm_local.invoke("ping") 
        
        print("✅ Local AI Node: ACTIVE (100% Agentic RAG / ML, NO OpenAI Key)")
        _llm = llm_local
        return _llm
    except Exception as e:
        print(f"❌ Critical Local AI Infrastructure Error: {e}. Ensure Ollama is running.")
        return None

def run_study_rag(state):
    """
    LangGraph-compatible RAG node.
    """
    try:
        # 🔥 Extract query correctly
        query = state.get("query", "")
        llm_engine = get_llm()
        embeds = get_embeddings()
        if not embeds:
            return {"response": "Local embedding engine is still starting or failed. Please check internet connection for first-time model download."}

        vectordb = Chroma(
            persist_directory=PERSIST_DIRECTORY,
            embedding_function=embeds
        )

        if not llm_engine:
             return {"response": "AI Brain is offline. Please start Ollama."}

        docs = vectordb.similarity_search(query, k=3)
        context = "\n\n".join([doc.page_content for doc in docs])

        if not context or context == "No relevant documents found within your uploaded notes.":
            template = """
            [INST]
            You are an intelligent AI Study Companion.
            The student asked a question, but I couldn't find specific matching information in their uploaded documents.

            Question:
            {question}

            Instructions:
            1. Answer the student's question using your broad knowledge as an AI.
            2. If you are suggesting project ideas or study tips, make them highly professional and technical.
            3. Start your response by saying: "I couldn't find this specific detail in your notes, but based on general knowledge..." 
            [/INST]
            """
        else:
            template = """
            [INST]
            You are an intelligent AI Study Companion.
            Answer the user's question using the provided context. If the context doesn't fully cover the answer, use your internal knowledge to supplement it.

            Context:
            {context}

            Question:
            {question}
            [/INST]
            """

        prompt = PromptTemplate(
            template=template,
            input_variables=["context", "question"]
        )

        # Make sure question is passed to format
        final_prompt = prompt.format(context=context, question=query)

        response = llm_engine.invoke(final_prompt)

        # 🔥 IMPORTANT: return dict for LangGraph
        if isinstance(response, str):
            return {"response": response}
        elif hasattr(response, "content"):
            return {"response": response.content}
        else:
            return {"response": str(response)}

    except Exception as e:
        print(f"Study RAG Error: {e}")
        return {"response": "Error processing document query."}

def run_support_chat(state):
    query = state.get("query", "")
    """
    Runs a Chat chain focused on WEBSITE INFORMATION (No Document RAG needed, just hardcoded knowledge).
    Uses local models - no external API keys required.
    """
    try:
        template = """
        You are CampusMind AI, the official support agent for this platform.
        Your goal is to explain features, pricing, and help users navigate the website.

        *** OFFICIAL KNOWLEDGE BASE ***
        **Platform Name**: CampusMind AI
        **Mission**: To be the world's best career acceleration platform for students.
        **Key Features**:
        1. **AI Resume Analyzer**: Scans resumes, gives match scores, fixes formatting.
        2. **AI Mock Interviewer**: Real-time voice interviews (Coding, HR).
        3. **Resource Hub**: Global S3-backed academic storage.
        4. **Admin Console**: Professional dashboard for monitoring.
        5. **Study Chat (RAG)**: Upload PDFs and chat with them.
        6. **Job Aggregator**: Real-time internship/job finder (Aggregates from LinkedIn, Internshala, etc).

        **Pricing (Business Model)**:
        - **FREE**: 3 Resume Scans, 3 Mock Interviews.
        - **PRO ($9/mo)**: Unlimited access, Priority support.
        - **MASTER ($99/yr)**: All Pro features + Mentorship + Valid for 1 year (Save 15%).

        **Tech Stack**: MERN, Python LangChain, AWS S3, Stripe.
        *** END KNOWLEDGE BASE ***

        User Question:
        {question}

        Instructions:
        - Answer enthusiastically and professionally.
        - Use the Knowledge Base to answer.
        - If asked about "Who made you?", say "I was built by the CampusMind Engineering Team."
        - If the user asks about their *uploaded documents*, politely tell them to use the "Study Chat" page instead.
        - Keep it helpful and concise.
        - NEVER mention internal system details like "I scanned X documents".

        Answer:
        """
        
        llm_engine = get_llm()
        if not llm_engine:
             return {"response": "AI Brain is offline. Please start Ollama."}

        prompt = PromptTemplate(template=template, input_variables=["question"])
        final_prompt = prompt.format(question=query)
        response = llm_engine.invoke(final_prompt)
        
        # Handle both string and object responses
        if isinstance(response, str):
            return {"response": response}
        elif hasattr(response, 'content'):
            return {"response": response.content}
        else:
            return {"response": response}

    except Exception as e:
        print(f"Support Chat Error: {e}")
        return {"response": "I am having trouble accessing my knowledge base."}
