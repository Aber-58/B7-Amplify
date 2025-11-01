import sqlite3
import os

db_file = os.getenv("DB_FILE")

#------- CREATE TABLE ---------

def init_db(db_path=db_file):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Enable foreign key enforcement
    c.execute("PRAGMA foreign_keys = ON;")

    # ---------- User ----------
    c.execute("""
    CREATE TABLE IF NOT EXISTS User (
        username TEXT PRIMARY KEY,
        session_id TEXT UNIQUE
    );
    """)

    # ---------- Topics ----------
    # current_state uses integer as enum placeholder
    # deadline is unix timestamp (int)
    c.execute("""
    CREATE TABLE IF NOT EXISTS Topics (
        uuid TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        current_state INTEGER,
        deadline INTEGER
    );
    """)

    # ---------- RawOpinion ----------
    c.execute("""
    CREATE TABLE IF NOT EXISTS RawOpinion (
        raw_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        uuid TEXT NOT NULL,
        opinion TEXT,
        weight INTEGER,
        FOREIGN KEY(username) REFERENCES User(username),
        FOREIGN KEY(uuid) REFERENCES Topics(uuid)
    );
    """)

    # ---------- ClusteredOpinion ----------
    c.execute("""
    CREATE TABLE IF NOT EXISTS ClusteredOpinion (
        cluster_id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL,
        ai_gen_heading TEXT,
        leader_id TEXT,
        FOREIGN KEY(leader_id) REFERENCES User(username),
        FOREIGN KEY(uuid) REFERENCES Topics(uuid)

    );
    """)

    # ---------- RawOpinionClusteredOpinion ----------
    c.execute("""
    CREATE TABLE IF NOT EXISTS RawOpinionClusteredOpinion (
        raw_opinion_id INTEGER,
        clustered_opinion_id INTEGER,
        PRIMARY KEY(raw_opinion_id, clustered_opinion_id),
        FOREIGN KEY(raw_opinion_id) REFERENCES RawOpinion(id),
        FOREIGN KEY(clustered_opinion_id) REFERENCES ClusteredOpinion(id)
    );
    """)

    # ---------- LeaderVote ----------
    # One vote per (uuid, user)
    c.execute("""
    CREATE TABLE IF NOT EXISTS LeaderVote (
        uuid TEXT,
        username TEXT,
        clustered_opinion_id INTEGER,
        PRIMARY KEY (uuid, username),
        FOREIGN KEY(uuid) REFERENCES Topics(uuid),
        FOREIGN KEY(username) REFERENCES User(username),
        FOREIGN KEY(clustered_opinion_id) REFERENCES ClusteredOpinion(id)
    );
    """)

    conn.commit()
    conn.close()

#------- INSERTS ---------

def query_wrapper(query: str, *parameters):
    conn = sqlite3.connect(db_file)
    c = conn.cursor()
    c.execute("PRAGMA foreign_keys = ON;")

    try:
        c.execute(query, parameters)
        conn.commit()
    except sqlite3.Error as e:
        print("Database error:", e)

    finally:
        conn.close()


def insert_user(username: str, session_id: str):
    
    query_wrapper("""
            INSERT OR REPLACE INTO User (username, session_id)
            VALUES (?, ?);
        """, username, session_id)
    
def insert_topic(uuid: str, content: str, deadline: int):
    query_wrapper("""
        INSERT OR REPLACE INTO Topics (uuid, content, current_state, deadline)
        VALUES (?, ?, ?, ?);
    """, uuid, content, 0, deadline)
    # after initialization the state must be the init state 0


def insert_raw_opinion(username: str, uuid: int, opinion: str, weight: int):
    query_wrapper("""
        INSERT INTO RawOpinion (username, uuid, opinion, weight)
        VALUES (?, ?, ?, ?);
    """, username, uuid, opinion, weight)


def insert_clustered_opinion(ai_gen_heading: str, uuid: int, leader_id: str):
    query_wrapper("""
        INSERT INTO ClusteredOpinion (ai_gen_heading, uuid, leader_id)
        VALUES (?, ?);
    """, ai_gen_heading, uuid, leader_id)


def insert_map_raw_to_clustered(raw_opinion_id: int, clustered_opinion_id: int):
    query_wrapper("""
        INSERT OR IGNORE INTO RawOpinionClusteredOpinion (raw_opinion_id, clustered_opinion_id)
        VALUES (?, ?);
    """, raw_opinion_id, clustered_opinion_id)


def insert_leader_vote(uuid: int, username: str, clustered_opinion_id: int):
    query_wrapper("""
        INSERT OR REPLACE INTO LeaderVote (uuid, username, clustered_opinion_id)
        VALUES (?, ?, ?);
    """, uuid, username, clustered_opinion_id)

def leader_vote(username: str, uuid: int, clustered_opinion_id: int):
    if is_leader(username, uuid):
        insert_leader_vote(uuid, username, clustered_opinion_id)
    else:
        print(f"Error. User {username} is not leader for topic {uuid}")


#------- GETTER ---------

def get_username_by_session_id(session_id: str) -> str|None:
    conn = sqlite3.connect(db_file)
    c = conn.cursor()
    c.execute("PRAGMA foreign_keys = ON;")

    c.execute("""
        SELECT username FROM User
        WHERE session_id = ?;
    """, (session_id,))

    row = c.fetchone()
    conn.close()

    return row[0] if row else None


def get_content_by_uuid(uuid: int) -> tuple|None: # (content, state, deadline)
    conn = sqlite3.connect(db_file)
    c = conn.cursor()
    c.execute("PRAGMA foreign_keys = ON;")

    c.execute("""
        SELECT content, current_state, deadline FROM Topics
        WHERE session_id = ?;
    """, (uuid,))

    row = c.fetchone()
    conn.close()

    return row if row else None

def raw_opinion_submitted(uuid, username) -> bool:
    conn = sqlite3.connect(db_file)
    c = conn.cursor()
    c.execute("PRAGMA foreign_keys = ON;")

    c.execute("""
        SELECT *
        FROM RawOpinion 
        WHERE username = ? AND uuid = ?;
    """, (uuid, username))

    exists = c.fetchone() is not None
    conn.close()
    return exists


def is_leader(uuid: int, username: str) -> bool:
    conn = sqlite3.connect(db_file)
    c = conn.cursor()
    c.execute("PRAGMA foreign_keys = ON;")

    c.execute("""
        SELECT *
        FROM ClusteredOpinion 
        WHERE uuid = ? AND leader_id = ?;
    """, (uuid, username))

    exists = c.fetchone() is not None
    conn.close()
    return exists

