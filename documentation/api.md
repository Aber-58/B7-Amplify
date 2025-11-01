# User-facing

all text/html

- admin panel: /admin

- qr code: join/<uuidv4>

- enter username: /login/<uuidv4> (html form for username, gives session cookie)
- question: /poll/<uuidv4> (session cookie present)
- loading: /loading/<uuidv4> (session cookie present) (polls api)
- live view: /live/<uuidv4>

## Session state

- current state: INIT -> QUESTION(topic id) -> LOADING(topic id) -> LIVE(is_leader, topic id) -> RESULT(topic id) -> INIT

# Database

User(**username**, session id)
Topics(**uuid**, content, current_state, deadline)
RawOpinion(**id**, username->User, topic->Topics, opinion, weigth)
RawOpinionClusteredOpinion(**id**->RawOpinion, **id**->ClusteredOpinion)
ClusteredOpinion(**id**, ai gen. heading, leader id->User)

LeaderChat(uuid->Topic, username->User, message)
LeaderVote(uuid->Topic, username->User, id->ClusteredOpinion)
// to be detailed by implementor


