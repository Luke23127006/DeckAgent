PRAGMA application_id=1145128004;
PRAGMA user_version=1;
CREATE TABLE decks(session_id TEXT PRIMARY KEY,outline_id TEXT NOT NULL,plan TEXT NOT NULL,version INTEGER NOT NULL CHECK(version>0)) STRICT;
CREATE TABLE slides(session_id TEXT NOT NULL REFERENCES decks(session_id),slide_id TEXT NOT NULL,title TEXT NOT NULL,position INTEGER NOT NULL,revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0),PRIMARY KEY(session_id,slide_id),UNIQUE(session_id,position)) STRICT;
CREATE TABLE revisions(session_id TEXT NOT NULL,slide_id TEXT NOT NULL,revision INTEGER NOT NULL CHECK(revision>0),html TEXT NOT NULL,PRIMARY KEY(session_id,slide_id,revision),FOREIGN KEY(session_id,slide_id) REFERENCES slides(session_id,slide_id)) STRICT;
CREATE TABLE publications(session_id TEXT NOT NULL REFERENCES decks(session_id),publication_id TEXT NOT NULL,fingerprint TEXT NOT NULL,receipt TEXT NOT NULL,PRIMARY KEY(session_id,publication_id)) STRICT;
INSERT INTO decks VALUES('legacy','legacy-outline','{"outlineId":"legacy-outline","slides":[{"slideId":"intro","title":"Legacy"}]}',2);
INSERT INTO slides VALUES('legacy','intro','Legacy',0,1);
INSERT INTO revisions VALUES('legacy','intro',1,'<h1>Legacy content</h1>');
