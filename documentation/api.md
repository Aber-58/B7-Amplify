# User-facing

all text/html

- admin panel: /admin
- POST:
    - RequestBody:
        - { topic: string } // von Admin angebebene topics
    - ResponseBody:
        - { uuid: string, deadline: int } // UUID der Umfrage und deadline unix timestamp


- qr code: join/<uuidv4>
- POST:
    - RequestHeader:
    - { sessionCookie } // von Admin angebebene topics
    - RequestParameter:
        - { uuid: string } // UUID der Umfrage
    - ResponseBody:
        - { topic: string, state: string, username: string } // UUID der Umfrage, state siehe enum unten

- enter username: /login (html form for username, gives session cookie)
- POST:
    - RequestBody:
        - { username: string }
    - ResponseHeader:
        - { sessionCookie }

- question: /poll/<uuidv4> (session cookie present)
- POST:
    - RequestHeader:
        - { sessionCookie }
        - RequestParameter:
            - { uuid: string }
        - RequestBody:
            - { opinion: string, rating: number}
- live view: /live/<uuidv4>
- GET:
    - RequestHeader:
        - { sessionCookie }
    - ResponseBody:
            - { tbd, isLeader: true }
- POST:
    - RequestParameter:
      - { uuid: string }
    - RequestHeader:
        - { sessionCookie }
      - RequestBody:
          - { tbd }

## Session state

- current state: QUESTION(topic id) -> LOADING(topic id) -> LIVE(is_leader, topic id) -> RESULT(topic id) -> INIT

enum:
 - question
 - loading
 - live
 - result

# Database

User(**username**, session id)
Topics(**uuid**, content, current_state, deadline)
RawOpinion(**id**, username->User, topic->Topics, opinion, weigth)
RawOpinionClusteredOpinion(**id**->RawOpinion, **id**->ClusteredOpinion)
ClusteredOpinion(**id**, topic,->Topic ai gen. heading, leader id->User)

LeaderChat(uuid->Topic, username->User, message)
LeaderVote(uuid->Topic, username->User, id->ClusteredOpinion)
// to be detailed by implementor


