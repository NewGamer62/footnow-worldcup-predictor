-- SAE BUT2 2026
-- Triggers PL/pgSQL - Automatisations
-- Projet prediction Coupe du Monde 2026
-- Auteur : Ahmed Fikri


-- =====================================================
-- TRIGGER 1 : Mise a jour automatique du classement
-- de groupe apres insertion d un resultat
-- =====================================================

-- Fonction du trigger 1 (la table classement_groupe est créée par Prisma)
CREATE OR REPLACE FUNCTION fn_maj_classement_groupe()
RETURNS TRIGGER AS $$
DECLARE
    v_eq_dom   VARCHAR;
    v_eq_ext   VARCHAR;
    v_id_groupe INT;
BEGIN
    SELECT equipe_dom, equipe_ext, id_groupe
    INTO v_eq_dom, v_eq_ext, v_id_groupe
    FROM match_cdm2026
    WHERE id_match_wc = NEW.id_match_wc;

    IF v_id_groupe IS NULL THEN RETURN NEW; END IF;

    -- Initialiser les lignes si elles n existent pas
    INSERT INTO classement_groupe (id_groupe, equipe)
    VALUES (v_id_groupe, v_eq_dom)
    ON CONFLICT (id_groupe, equipe) DO NOTHING;

    INSERT INTO classement_groupe (id_groupe, equipe)
    VALUES (v_id_groupe, v_eq_ext)
    ON CONFLICT (id_groupe, equipe) DO NOTHING;

    -- MAJ equipe domicile
    UPDATE classement_groupe SET
        matchs_joues = matchs_joues + 1,
        buts_pour    = buts_pour + NEW.score_dom,
        buts_contre  = buts_contre + NEW.score_ext,
        victoires    = victoires + CASE WHEN NEW.score_dom > NEW.score_ext THEN 1 ELSE 0 END,
        nuls         = nuls + CASE WHEN NEW.score_dom = NEW.score_ext THEN 1 ELSE 0 END,
        defaites     = defaites + CASE WHEN NEW.score_dom < NEW.score_ext THEN 1 ELSE 0 END,
        points       = points +
            CASE
                WHEN NEW.score_dom > NEW.score_ext THEN 3
                WHEN NEW.score_dom = NEW.score_ext THEN 1
                ELSE 0
            END
    WHERE id_groupe = v_id_groupe AND equipe = v_eq_dom;

    -- MAJ equipe exterieur
    UPDATE classement_groupe SET
        matchs_joues = matchs_joues + 1,
        buts_pour    = buts_pour + NEW.score_ext,
        buts_contre  = buts_contre + NEW.score_dom,
        victoires    = victoires + CASE WHEN NEW.score_ext > NEW.score_dom THEN 1 ELSE 0 END,
        nuls         = nuls + CASE WHEN NEW.score_dom = NEW.score_ext THEN 1 ELSE 0 END,
        defaites     = defaites + CASE WHEN NEW.score_ext < NEW.score_dom THEN 1 ELSE 0 END,
        points       = points +
            CASE
                WHEN NEW.score_ext > NEW.score_dom THEN 3
                WHEN NEW.score_dom = NEW.score_ext THEN 1
                ELSE 0
            END
    WHERE id_groupe = v_id_groupe AND equipe = v_eq_ext;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Creation du trigger 1
DROP TRIGGER IF EXISTS trg_maj_classement_groupe ON resultat;

CREATE TRIGGER trg_maj_classement_groupe
AFTER INSERT ON resultat
FOR EACH ROW
EXECUTE FUNCTION fn_maj_classement_groupe();


-- =====================================================
-- TRIGGER 2 : Recalcul automatique des predictions
-- apres insertion d un resultat
-- =====================================================

CREATE OR REPLACE FUNCTION fn_recalcul_predictions()
RETURNS TRIGGER AS $$
DECLARE
    v_eq_dom  VARCHAR;
    v_eq_ext  VARCHAR;
    rec       RECORD;
BEGIN
    SELECT equipe_dom, equipe_ext
    INTO v_eq_dom, v_eq_ext
    FROM match_cdm2026
    WHERE id_match_wc = NEW.id_match_wc;

    -- Recalculer les predictions de tous les prochains matchs
    -- impliquant ces deux equipes
    FOR rec IN (
        SELECT id_match_wc
        FROM match_cdm2026
        WHERE (equipe_dom = v_eq_dom OR equipe_ext = v_eq_dom
            OR equipe_dom = v_eq_ext OR equipe_ext = v_eq_ext)
          AND id_match_wc NOT IN (SELECT id_match_wc FROM resultat)
    ) LOOP
        PERFORM calculer_prediction(rec.id_match_wc);
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Creation du trigger 2
DROP TRIGGER IF EXISTS trg_recalcul_predictions ON resultat;

CREATE TRIGGER trg_recalcul_predictions
AFTER INSERT ON resultat
FOR EACH ROW
EXECUTE FUNCTION fn_recalcul_predictions();


