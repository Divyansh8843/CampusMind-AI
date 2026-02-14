from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate

# Use Ollama for local LLM (no API key required)
llm = OllamaLLM(model="llama2", temperature=0.7)

def analyze_resume(text: str, jd: str = ""):
    """
    Analyzes a resume against a job description (optional) or general best practices.
    Uses local Ollama model - no external API keys required.
    """
    try:
        
        template = """
        You are an expert Career Counselor and Resume Reviewer for college students.
        Review the following resume content and provide:
        1. A score out of 100.
        2. Three key strengths.
        3. Three areas for improvement.
        4. Specific advice on how to tailor this for the job market.

        Resume Content:
        {resume}

        Job Description (if any):
        {jd}

        Format the output in clear Markdown.
        """
        
        prompt = PromptTemplate(
            template=template, 
            input_variables=["resume", "jd"]
        )
        
        final_prompt = prompt.format(resume=text, jd=jd)
        response = llm.invoke(final_prompt)
        
        # Handle both string and object responses
        if isinstance(response, str):
            return {"response": response}
        elif hasattr(response, 'content'):
            return {"response": response.content}
        else:
            return {"response": str(response)}
        
    except Exception as e:
        return {"response": f"Error analyzing resume: {str(e)}"}
