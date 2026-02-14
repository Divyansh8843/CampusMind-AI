from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate
import os

# Ensure the DB directory exists
PERSIST_DIRECTORY = "chroma_db"
if not os.path.exists(PERSIST_DIRECTORY):
    os.makedirs(PERSIST_DIRECTORY)

# Use local embeddings (no API key required)
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'}
)

# Use Ollama for local LLM (no API key required)
# Make sure Ollama is running with: ollama serve
# And pull model: ollama pull llama2
# NOTE: Temperature reduced for stricter adherence
print("DEBUG: Initializing OllamaLLM in rag_chain.py...")
llm = OllamaLLM(model="llama2", temperature=0.1)


def run_study_rag(query: str):
    """
    Runs a RAG chain focused on ACADEMIC DOCUMENTS uploaded by the student.
    Uses local models - no external API keys required.
    """
    try:
        vectordb = Chroma(
            persist_directory=PERSIST_DIRECTORY,
            embedding_function=embeddings
        )

        # Retrieve relevant documents
        docs = vectordb.similarity_search(query, k=3)
        context = "\n\n".join([doc.page_content for doc in docs])

        if not context:
            context = "No relevant documents found within your uploaded notes."

        template = """
        [INST]
        You are an intelligent AI Study Companion.
        Your primary role is to answer questions based *strictly* on the provided Context from uploaded documents.
        
        Context:
        {context}

        Question:
        {question}

        Instructions:
        1. Answer the question using ONLY the information provided in the Context above.
        2. If the context says "No relevant documents found", reply with: "I couldn't find specific information about that in your uploaded documents." and stop.
        3. Do NOT mention "scanning documents", "retrieval", or any internal process.
        4. Do NOT make up facts. If the answer is not in the context, admit it.
        5. Be concise, encouraging, and educational.
        [/INST]
        """

        prompt = PromptTemplate(template=template, input_variables=["context", "question"])
        final_prompt = prompt.format(context=context, question=query)
        response = llm.invoke(final_prompt)
        
        # Handle both string and object responses
        if isinstance(response, str):
            return {"response": response}
        elif hasattr(response, 'content'):
            return {"response": response.content}
        else:
            return {"response": str(response)}

    except Exception as e:
        print(f"Study RAG Error: {e}")
        return {"response": "Error processing document query."}

def run_support_chat(query: str):
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
        
        prompt = PromptTemplate(template=template, input_variables=["question"])
        final_prompt = prompt.format(question=query)
        response = llm.invoke(final_prompt)
        
        # Handle both string and object responses
        if isinstance(response, str):
            return {"response": response}
        elif hasattr(response, 'content'):
            return {"response": response.content}
        else:
            return {"response": str(response)}

    except Exception as e:
        print(f"Support Chat Error: {e}")
        return {"response": "I am having trouble accessing my knowledge base."}
