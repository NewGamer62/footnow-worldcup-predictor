-- =====================================================
-- SAE BUT2 2026
-- Création des tables PostgreSQL
-- Projet prédiction Coupe du Monde 2026
-- Auteur : Ahmed Fikri

-- =====================================================


-- =========================
-- SUPPRESSION
-- =========================

DROP TABLE IF EXISTS prediction CASCADE;
DROP TABLE IF EXISTS token_api CASCADE;
DROP TABLE IF EXISTS utilisateur CASCADE;
DROP TABLE IF EXISTS resultat CASCADE;
DROP TABLE IF EXISTS match_cdm2026 CASCADE;
DROP TABLE IF EXISTS match_historique CASCADE;
DROP TABLE IF EXISTS groupe CASCADE;
DROP TABLE IF EXISTS equipe CASCADE;


-- =========================
-- TABLE EQUIPE
-- =========================

CREATE TABLE equipe (
    id_equipe     SERIAL PRIMARY KEY,
    nom           VARCHAR(100) UNIQUE NOT NULL,
    classement    INT,
    points_fifa   NUMERIC(8,2)
);


-- =========================
-- TABLE GROUPE
-- =========================

CREATE TABLE groupe (
    id_groupe   SERIAL PRIMARY KEY,
    nom         VARCHAR(10) UNIQUE NOT NULL  
);


-- =========================
-- TABLE MATCH HISTORIQUE
-- =========================

CREATE TABLE match_historique (
    id_match        SERIAL PRIMARY KEY,
    date_match      DATE,
    equipe1         VARCHAR(100),
    equipe2         VARCHAR(100),
    score1          INT CHECK (score1 >= 0),
    score2          INT CHECK (score2 >= 0),
    tournoi         VARCHAR(150),
    pays            VARCHAR(100)
);


-- =========================
-- TABLE MATCH CDM 2026
-- =========================

CREATE TABLE match_cdm2026 (
    id_match_wc     SERIAL PRIMARY KEY,
    numero          INT,
    phase           VARCHAR(50),
    equipe_dom      VARCHAR(100),
    equipe_ext      VARCHAR(100),
    id_groupe       INT REFERENCES groupe(id_groupe)
);


-- =========================
-- TABLE RESULTAT
-- =========================

CREATE TABLE resultat (
    id_resultat     SERIAL PRIMARY KEY,
    id_match_wc     INT UNIQUE REFERENCES match_cdm2026(id_match_wc),
    score_dom       INT CHECK (score_dom >= 0),
    score_ext       INT CHECK (score_ext >= 0),
    date_saisie     TIMESTAMP DEFAULT NOW()
);


-- =========================
-- TABLE UTILISATEUR
-- =========================

CREATE TABLE utilisateur (
    id_utilisateur  SERIAL PRIMARY KEY,
    login           VARCHAR(50) UNIQUE NOT NULL,
    password        TEXT NOT NULL,
    role            VARCHAR(20) DEFAULT 'visiteur'  -- 'admin' ou 'visiteur'
);


-- =========================
-- TABLE TOKEN API
-- =========================

CREATE TABLE token_api (
    id_token        SERIAL PRIMARY KEY,
    id_utilisateur  INT REFERENCES utilisateur(id_utilisateur),
    token           TEXT UNIQUE NOT NULL,
    date_creation   TIMESTAMP DEFAULT NOW(),
    date_expiration TIMESTAMP,
    actif           BOOLEAN DEFAULT TRUE
);


-- =========================
-- TABLE PREDICTION
-- =========================

CREATE TABLE prediction (
    id_prediction   SERIAL PRIMARY KEY,
    id_match_wc     INT UNIQUE REFERENCES match_cdm2026(id_match_wc),
    proba_dom       NUMERIC(5,2),   -- probabilité victoire équipe domicile
    proba_nul       NUMERIC(5,2),   -- probabilité match nul
    proba_ext       NUMERIC(5,2),   -- probabilité victoire équipe extérieur
    date_calcul     TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_probas CHECK (
        proba_dom >= 0 AND proba_dom <= 100 AND
        proba_nul >= 0 AND proba_nul <= 100 AND
        proba_ext >= 0 AND proba_ext <= 100
    )
);


-- =========================
-- TABLE CLASSEMENT GROUPE
-- =========================

CREATE TABLE classement_groupe (
    id_classement    SERIAL PRIMARY KEY,
    id_groupe        INT NOT NULL REFERENCES groupe(id_groupe),
    equipe           VARCHAR(100) NOT NULL,
    points           INT DEFAULT 0,
    buts_pour        INT DEFAULT 0,
    buts_contre      INT DEFAULT 0,
    matchs_joues     INT DEFAULT 0,
    victoires        INT DEFAULT 0,
    nuls             INT DEFAULT 0,
    defaites         INT DEFAULT 0,
    CONSTRAINT uq_classement_groupe UNIQUE (id_groupe, equipe)
);


-- =========================
-- INDEX
-- =========================

CREATE INDEX idx_match_historique_date   ON match_historique(date_match);
CREATE INDEX idx_match_historique_eq1    ON match_historique(equipe1);
CREATE INDEX idx_match_historique_eq2    ON match_historique(equipe2);
CREATE INDEX idx_match_cdm_phase         ON match_cdm2026(phase);
CREATE INDEX idx_prediction_match        ON prediction(id_match_wc);
CREATE INDEX idx_token_actif             ON token_api(actif);


-- =========================
-- INSERTION DES GROUPES 
-- =========================

INSERT INTO groupe (nom) VALUES
    ('Group A'), ('Group B'), ('Group C'), ('Group D'),
    ('Group E'), ('Group F'), ('Group G'), ('Group H'),
    ('Group I'), ('Group J'), ('Group K'), ('Group L');

