import ollama


class EmbeddingModel:
    """
    Embedding model wrapper using Ollama (offline).
    Default: nomic-embed-text
    """

    def __init__(self, model: str = "nomic-embed-text"):
        self.model = model

    def embed(self, text: str) -> list:
        response = ollama.embeddings(
            model=self.model,
            prompt=text
        )
        return response["embedding"]
