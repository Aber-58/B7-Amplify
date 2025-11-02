from sentiment_analyzer import SentimentAnalyzer


analyzer = SentimentAnalyzer()
message_texts = ['i hate LV1', "i love LV2"]
sentiment_results = analyzer.analyze_batch(message_texts)

# Combine results
# for i, msg in enumerate(messages):
#     msg['sentiment'] = sentiment_results[i] if i < len(sentiment_results) else None


print(message_texts)
print(sentiment_results)