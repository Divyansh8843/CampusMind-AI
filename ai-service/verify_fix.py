import sys
import os
import shutil
import importlib.util

def clean_pycache():
    print("🧹 Cleaning __pycache__ directories...")
    cleaned = 0
    for root, dirs, files in os.walk("."):
        for d in dirs:
            if d == "__pycache__":
                path = os.path.join(root, d)
                try:
                    shutil.rmtree(path)
                    cleaned += 1
                except Exception as e:
                    print(f"Failed to remove {path}: {e}")
    print(f"✅ Removed {cleaned} __pycache__ directories.")

def verify_code():
    print("\n🔍 Verifying Code Changes...")
    
    # 1. Check rag_chain.py content on disk
    rag_path = os.path.join("app", "rag", "rag_chain.py")
    with open(rag_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    if "OllamaLLM(model=\"phi3\",  temperature=0.1)" in content:
        print("✅ rag_chain.py is UPDATED correctly ( temperature=0.1, OllamaLLM used).")
    else:
        print("❌ rag_chain.py is OUTDATED!")
        
    if "Ollama(model=\"phi3\",  temperature=0.10.3)" in content:
        print("❌ rag_chain.py still contains OLD code ( temperature=0.10.3)!")
    else:
        print("✅ Old code removed from rag_chain.py.")

    # 2. Check study_agent.py routing
    agent_path = os.path.join("app", "agents", "study_agent.py")
    with open(agent_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    if "generate_study_plan(state[\"query\"])" in content:
        print("✅ study_agent.py is UPDATED (Routes 'planner' correctly).")
    else:
        print("❌ study_agent.py is OUTDATED!")

if __name__ == "__main__":
    clean_pycache()
    verify_code()
    print("\n🚀 Verification Complete. usage of 'python -m app.main' should now work.")
