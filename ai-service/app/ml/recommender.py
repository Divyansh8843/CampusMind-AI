from ml.preprocess import preprocess
from ml.performance_model import train_model, predict

def get_weak_topics(student_data):
    X, y, topics = preprocess(student_data)
    model = train_model(X, y)
    return predict(model, X, topics)
