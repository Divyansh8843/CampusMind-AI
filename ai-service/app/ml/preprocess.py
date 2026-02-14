import pandas as pd

def preprocess(data):
    df = pd.DataFrame(data)
    X = df[["score", "time_spent", "attempts"]]
    y = (df["score"] < 50).astype(int)  # 1 = weak topic
    return X, y, df["topic"]
