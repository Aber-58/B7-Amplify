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
        data = json.loads(res.choices[0].message.content.replace('json', '').replace('`', ''))
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
    "Category <number>: \n <Title>" for each of the categories. Write no additonal text.
    
    """ 
    for cat, texts in grouped_texts.items():
        prompt += f"\nCategory {cat}:"
        prompt += ', '.join(texts)

    return prompt

def choose_proposed_solutions(cluster_data): # clusterdata from db
    prompt = """You will receive a list of solution proposed by various users.
    Out of the whole list, generate 2-3 solutions that are the most represented.
    The format should be <Title (2 Words max)>:<one example from a user that represents the title>
    Return it as a json format, no additional text. Add NO formatting using the `-Symbol, just raw string without `
    """ 
    opinions_by_heading = {
        cluster["heading"]: [op["opinion"] for op in cluster["raw_opinions"]]
        for cluster in cluster_data["clusters"]
    }
    heading = cluster_data['clusters'][0]["heading"]
    prompt += f"\n {opinions_by_heading[heading]}"
    return heading, prompt




# cluster = {"clusters":[{"cluster_id":2,"heading":"Full remote work increases productivity","leader_id":"liam","raw_opinions":[{"opinion":"Hybrid work model is the best balance","raw_id":11,"username":"kelly","weight":8},{"opinion":"Full remote work increases productivity","raw_id":12,"username":"liam","weight":9},{"opinion":"In-person collaboration is essential for creativity","raw_id":13,"username":"mia","weight":6},{"opinion":"Flexible schedule with 2-3 days in office","raw_id":14,"username":"noah","weight":7}]}]}
# title, prompt = choose_proposed_solutions(cluster)
# mistral_result = ask_mistral(prompt)
# print({"title":title, "mistral_result":mistral_result})


# # Example
# texts_with_cat = {
#     "texts": [
#         "The food is bad and I'm allergic", "The spaghetti aren't well cooked", 'I do not like the food', "The coffee machine doesn't work", 'The kitchen is always too hot or too cold', "I've found mold in the fridge", "I'm allergic to something in the cafeteria", 'The lunch break is too short', "The shower doesn't have enough pressure", 'The shower is dirty', "The water isn't hot enough in the shower", "I don't like the bathroom layout", "There's no soap in the restroom", 'I like my co-worker Jeff', 'I get harassed in the shower by my coworkers', 'My boss is a prick', 'I get too many emails about work during my free time', 'My co-worker often interrupts me in meetings', "I've noticed a coworker stealing office supplies", 'The office dress code is too restrictive', 'I have to walk 30 minutes from the train station', "There aren't enough parking spaces", 'My commute is too long and tiring', 'The bus is always late', 'The car park is overcrowded', 'The elevator breaks down frequently', 'The parking lot is poorly lit at night', 'My bike is damaged in the parking area', "The chairs aren't comfortable", 'My PC is slow', "I'm pretty sure my desk changes height over night", 'I want a new chair because my doctor told me I need one', 'My laptop is slow', 'My chair causes back pain', 'The PC monitor is too small', 'The keyboard is old and sticky', 'I need a new mouse because the current one is broken', "The security isn't good enough", 'The security guard sleeps in his chair', "The company doesn't provide enough safety training", 'The front door is always unlocked', "The security cameras don't work in certain areas", "The company doesn't have a clear emergency plan", "The fire alarm system doesn't work properly", "I've seen unauthorized people in the office building"
#     ],
#     "categories": [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5]
# }
# prompt = get_category_titles_prompt(texts=texts_with_cat['texts'], labels=texts_with_cat['categories'])
# print(ask_mistral(prompt))