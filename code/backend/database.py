import sqlite3
import os

db_file = os.getenv("DB_FILE")

#------- CREATE TABLE ---------

def init(db_path=db_file):
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
        clustered_opinion_id INTEGER,
        FOREIGN KEY(username) REFERENCES User(username),
        FOREIGN KEY(uuid) REFERENCES Topics(uuid),
        FOREIGN KEY(clustered_opinion_id) REFERENCES ClusteredOpinion(cluster_id)
    );
    """)

    # ---------- ClusteredOpinion ----------
    c.execute("""
    CREATE TABLE IF NOT EXISTS ClusteredOpinion (
        cluster_id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL,
        current_heading TEXT,
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
        FOREIGN KEY(raw_opinion_id) REFERENCES RawOpinion(raw_id),
        FOREIGN KEY(clustered_opinion_id) REFERENCES ClusteredOpinion(cluster_id)
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
        FOREIGN KEY(clustered_opinion_id) REFERENCES ClusteredOpinion(cluster_id)
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


def query_wrapper_with_lastrowid(query: str, *parameters) -> int:
    """Query wrapper that returns the lastrowid for INSERT operations"""
    conn = sqlite3.connect(db_file)
    c = conn.cursor()
    c.execute("PRAGMA foreign_keys = ON;")

    try:
        c.execute(query, parameters)
        lastrowid = c.lastrowid
        conn.commit()
        return lastrowid
    except sqlite3.Error as e:
        print("Database error:", e)
        raise e
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


def update_raw_opinion_cluster(raw_id: int, clustered_opinion_id: int):
    """Update the clustered_opinion_id for a raw opinion"""
    query_wrapper("""
        UPDATE RawOpinion
        SET clustered_opinion_id = ?
        WHERE raw_id = ?;
    """, clustered_opinion_id, raw_id)


def replace_clusters_for_topic(clusters_data: list, topic_uuid: str) -> list:
    """Delete old clusters and insert new clusters"""
    conn = sqlite3.connect(db_file)
    c = conn.cursor()
    c.execute("PRAGMA foreign_keys = ON;")

    cluster_ids = []

    try:
        # Delete old clusters
        # Reset clustered_opinion_id in RawOpinion table
        c.execute("""
            UPDATE RawOpinion
            SET clustered_opinion_id = NULL
            WHERE uuid = ?;
        """, (topic_uuid,))

        # Delete from RawOpinionClusteredOpinion mapping table
        c.execute("""
            DELETE FROM RawOpinionClusteredOpinion
            WHERE clustered_opinion_id IN (
                SELECT cluster_id FROM ClusteredOpinion WHERE uuid = ?
            );
        """, (topic_uuid,))

        # Delete leader votes for this topic
        c.execute("""
            DELETE FROM LeaderVote WHERE uuid = ?;
        """, (topic_uuid,))

        # Delete clustered opinions
        c.execute("""
            DELETE FROM ClusteredOpinion WHERE uuid = ?;
        """, (topic_uuid,))

        # Insert new clusters
        for cluster_data in clusters_data:
            # Insert clustered opinion
            c.execute("""
                INSERT INTO ClusteredOpinion (current_heading, uuid, leader_id)
                VALUES (?, ?, ?);
            """, (cluster_data['heading'], topic_uuid, cluster_data['leader_id']))

            cluster_id = c.lastrowid
            cluster_ids.append(cluster_id)

            # Update raw opinions to reference this cluster
            for raw_opinion in cluster_data['raw_opinions']:
                c.execute("""
                    UPDATE RawOpinion
                    SET clustered_opinion_id = ?
                    WHERE raw_id = ?;
                """, (cluster_id, raw_opinion['raw_id']))

        conn.commit()
        return cluster_ids
    except sqlite3.Error as e:
        conn.rollback()
        print("Database error:", e)
        raise e
    finally:
        conn.close()


#------- GETTER ---------

def get_raw_opinions_for_topic(topic_uuid: str) -> list:
    """Get all raw opinions with raw_id, username, opinion, and weight for a topic"""
    conn = sqlite3.connect(db_file)
    c = conn.cursor()
    c.execute("PRAGMA foreign_keys = ON;")

    c.execute("""
        SELECT raw_id, username, opinion, weight
        FROM RawOpinion
        WHERE uuid = ?;
    """, (topic_uuid,))

    rows = c.fetchall()
    conn.close()

    return [{"raw_id": row[0], "username": row[1], "opinion": row[2], "weight": row[3]} for row in rows]

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
        WHERE uuid = ?;
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

