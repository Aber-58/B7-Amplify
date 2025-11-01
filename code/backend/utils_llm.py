from mistralai import Mistral
import os
import json

_API_KEY = os.getenv("MISTRAL_API_KEY", "")
if not _API_KEY:
    raise ValueError("Missing MISTRAL_API_KEY environment variable. Check whatsapp, didnt push it since env is public" )

_mistral = Mistral(api_key=_API_KEY)

def ask_mistral(prompt, model="mistral-small-latest"):
    res = _mistral.chat.complete(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        stream=False
    )
    try:
        data = json.loads(res.choices[0].message.content)
        return data
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Model response could not be parsed as JSON. "
            f"Raw content was:\n{res.choices[0].message.content}\n\n"
            f"Error details: {e}"
        )

def group_texts_by_label(texts, labels):
    grouped = {}
    for text, cat in zip(texts, labels):
        grouped[cat] = grouped.get(cat, [])
        grouped[cat].append(text)
    return grouped


def get_category_titles_prompt(texts, labels): 
    grouped_texts = group_texts_by_label(texts, labels)
    prompt = """You will receive information in the form of "Category <number>: \n <examples>"
    Your objective is to write a list with a very short title max 2 words for each of these topics. The format of your answer should be like a jason, yet skip using ` for formatting:
    "Category <number>: \n <TItle>" for each of the categories. Write no additonal text.
    
    """ 
    for cat, texts in grouped_texts.items():
        prompt += "\nCategory {cat}:"
        prompt += ', '.join(texts)

    return prompt


## Example usage
# texts_with_cat = {
#     "texts": [
#         "The food is bad and I'm allergic", "The spaghetti aren't well cooked", 'I do not like the food', "The coffee machine doesn't work", 'The kitchen is always too hot or too cold', "I've found mold in the fridge", "I'm allergic to something in the cafeteria", 'The lunch break is too short', "The shower doesn't have enough pressure", 'The shower is dirty', "The water isn't hot enough in the shower", "I don't like the bathroom layout", "There's no soap in the restroom", 'I like my co-worker Jeff', 'I get harassed in the shower by my coworkers', 'My boss is a prick', 'I get too many emails about work during my free time', 'My co-worker often interrupts me in meetings', "I've noticed a coworker stealing office supplies", 'The office dress code is too restrictive', 'I have to walk 30 minutes from the train station', "There aren't enough parking spaces", 'My commute is too long and tiring', 'The bus is always late', 'The car park is overcrowded', 'The elevator breaks down frequently', 'The parking lot is poorly lit at night', 'My bike is damaged in the parking area', "The chairs aren't comfortable", 'My PC is slow', "I'm pretty sure my desk changes height over night", 'I want a new chair because my doctor told me I need one', 'My laptop is slow', 'My chair causes back pain', 'The PC monitor is too small', 'The keyboard is old and sticky', 'I need a new mouse because the current one is broken', "The security isn't good enough", 'The security guard sleeps in his chair', "The company doesn't provide enough safety training", 'The front door is always unlocked', "The security cameras don't work in certain areas", "The company doesn't have a clear emergency plan", "The fire alarm system doesn't work properly", "I've seen unauthorized people in the office building"
#     ],
#     "categories": [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5]
# }
# prompt = get_category_titles_prompt(texts=texts_with_cat['texts'], labels=texts_with_cat['categories'])
# print(ask_mistral(prompt))
