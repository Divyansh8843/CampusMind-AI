from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier()

def train_model(X, y):
    model.fit(X, y)
    return model

def predict(model, X, topics):
    preds = model.predict(X)
    weak_topics = topics[preds == 1].tolist()
    return weak_topics
