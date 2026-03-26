    -- SAE BUT2 2026
    -- Fonctions PL/pgSQL - Calcul des predictions
    -- Projet prediction Coupe du Monde 2026


    -- =====================================================
    -- FONCTION 1 : Score FIFA normalise
    -- Retourne un score entre 0 et 1 base sur les points FIFA
    -- =====================================================

    CREATE OR REPLACE FUNCTION get_score_fifa(p_equipe VARCHAR)
    RETURNS NUMERIC AS $$
    DECLARE
        v_points NUMERIC;
        v_max    NUMERIC;
        v_min    NUMERIC;
    BEGIN
        SELECT points_fifa INTO v_points
        FROM equipe WHERE nom = p_equipe;

        SELECT MAX(points_fifa) INTO v_max FROM equipe;
        SELECT MIN(points_fifa) INTO v_min FROM equipe;

        IF v_points IS NULL THEN RETURN 0.5; END IF;
        IF v_max = v_min THEN RETURN 0.5; END IF;

        RETURN (v_points - v_min) / (v_max - v_min);
    END;
    $$ LANGUAGE plpgsql;


    -- =====================================================
    -- FONCTION 2 : Score face a face
    -- Retourne un score entre 0 et 1 base sur l historique
    -- des confrontations entre deux equipes
    -- =====================================================

    CREATE OR REPLACE FUNCTION get_score_h2h(p_eq1 VARCHAR, p_eq2 VARCHAR)
    RETURNS NUMERIC AS $$
    DECLARE
        v_victoires_eq1 INT := 0;
        v_victoires_eq2 INT := 0;
        v_nuls          INT := 0;
        v_total         INT := 0;
    BEGIN
        SELECT
            SUM(CASE WHEN (equipe1 = p_eq1 AND score1 > score2)
                    OR (equipe2 = p_eq1 AND score2 > score1) THEN 1 ELSE 0 END),
            SUM(CASE WHEN (equipe1 = p_eq2 AND score1 > score2)
                    OR (equipe2 = p_eq2 AND score2 > score1) THEN 1 ELSE 0 END),
            SUM(CASE WHEN score1 = score2 THEN 1 ELSE 0 END),
            COUNT(*)
        INTO v_victoires_eq1, v_victoires_eq2, v_nuls, v_total
        FROM match_historique
        WHERE (equipe1 = p_eq1 AND equipe2 = p_eq2)
        OR (equipe1 = p_eq2 AND equipe2 = p_eq1);

        IF v_total = 0 THEN RETURN 0.5; END IF;

        RETURN ROUND(v_victoires_eq1::NUMERIC / v_total, 4);
    END;
    $$ LANGUAGE plpgsql;


    -- =====================================================
    -- FONCTION 3 : Forme recente
    -- Retourne un score entre 0 et 1 base sur les
    -- 10 derniers matchs d une equipe
    -- =====================================================

    CREATE OR REPLACE FUNCTION get_forme_recente(p_equipe VARCHAR)
    RETURNS NUMERIC AS $$
    DECLARE
        v_points_form  NUMERIC := 0;
        v_total_matchs INT     := 0;
        rec            RECORD;
    BEGIN
        FOR rec IN (
            SELECT
                CASE
                    WHEN (equipe1 = p_equipe AND score1 > score2) THEN 3
                    WHEN (equipe2 = p_equipe AND score2 > score1) THEN 3
                    WHEN score1 = score2 THEN 1
                    ELSE 0
                END AS pts
            FROM match_historique
            WHERE equipe1 = p_equipe OR equipe2 = p_equipe
            ORDER BY date_match DESC
            LIMIT 10
        ) LOOP
            v_points_form  := v_points_form + rec.pts;
            v_total_matchs := v_total_matchs + 1;
        END LOOP;

        IF v_total_matchs = 0 THEN RETURN 0.5; END IF;

        RETURN ROUND(v_points_form / (v_total_matchs * 3.0), 4);
    END;
    $$ LANGUAGE plpgsql;


    -- =====================================================
    -- FONCTION 4 : Calcul prediction d un match
    -- Combine les 3 scores avec ponderation :
    --   40% FIFA + 40% face-a-face + 20% forme recente
    -- Insere ou met a jour la prediction dans la table
    -- =====================================================

    CREATE OR REPLACE FUNCTION calculer_prediction(p_id_match_wc INT)
    RETURNS VOID AS $$
    DECLARE
        v_eq_dom   VARCHAR;
        v_eq_ext   VARCHAR;

        v_fifa_dom NUMERIC;
        v_fifa_ext NUMERIC;
        v_h2h_dom  NUMERIC;
        v_forme_dom NUMERIC;
        v_forme_ext NUMERIC;

        v_force_dom NUMERIC;
        v_force_ext NUMERIC;
        v_total     NUMERIC;

        v_proba_dom NUMERIC;
        v_proba_ext NUMERIC;
        v_proba_nul NUMERIC;
    BEGIN
        SELECT equipe_dom, equipe_ext
        INTO v_eq_dom, v_eq_ext
        FROM match_cdm2026
        WHERE id_match_wc = p_id_match_wc;

        IF v_eq_dom IS NULL OR v_eq_ext IS NULL THEN RETURN; END IF;
        IF v_eq_dom = 'To be announced' OR v_eq_ext = 'To be announced' THEN RETURN; END IF;

        v_fifa_dom  := get_score_fifa(v_eq_dom);
        v_fifa_ext  := get_score_fifa(v_eq_ext);
        v_h2h_dom   := get_score_h2h(v_eq_dom, v_eq_ext);
        v_forme_dom := get_forme_recente(v_eq_dom);
        v_forme_ext := get_forme_recente(v_eq_ext);

        v_force_dom := (0.40 * v_fifa_dom) + (0.40 * v_h2h_dom) + (0.20 * v_forme_dom);
        v_force_ext := (0.40 * v_fifa_ext) + (0.40 * (1 - v_h2h_dom)) + (0.20 * v_forme_ext);

        v_total := v_force_dom + v_force_ext;
        IF v_total = 0 THEN v_total := 1; END IF;

        v_proba_dom := ROUND((v_force_dom / v_total) * 80, 2);
        v_proba_ext := ROUND((v_force_ext / v_total) * 80, 2);
        v_proba_nul := ROUND(100 - v_proba_dom - v_proba_ext, 2);

        INSERT INTO prediction (id_match_wc, proba_dom, proba_nul, proba_ext, date_calcul)
        VALUES (p_id_match_wc, v_proba_dom, v_proba_nul, v_proba_ext, NOW())
        ON CONFLICT (id_match_wc)
        DO UPDATE SET
            proba_dom    = EXCLUDED.proba_dom,
            proba_nul    = EXCLUDED.proba_nul,
            proba_ext    = EXCLUDED.proba_ext,
            date_calcul  = NOW();
    END;
    $$ LANGUAGE plpgsql;


    -- FONCTION 5 : Calculer toutes les predictions
    -- Lance le calcul pour tous les matchs de la CdM 2026

    CREATE OR REPLACE FUNCTION calculer_toutes_predictions()
    RETURNS VOID AS $$
    DECLARE
        rec RECORD;
    BEGIN
        FOR rec IN SELECT id_match_wc FROM match_cdm2026 LOOP
            PERFORM calculer_prediction(rec.id_match_wc);
        END LOOP;
    END;
    $$ LANGUAGE plpgsql;


    -- =====================================================
    -- FONCTION 6 : Statistiques détaillées d'une équipe
    -- Retourne buts_pour, buts_contre, moyenne, taux victoires
    -- =====================================================

    CREATE OR REPLACE FUNCTION get_stats_equipe(p_equipe VARCHAR)
    RETURNS TABLE(
        equipe VARCHAR,
        matchs_joues INT,
        victoires INT,
        nuls INT,
        defaites INT,
        buts_pour INT,
        buts_contre INT,
        diff_buts INT,
        buts_moyen_pour NUMERIC,
        buts_moyen_contre NUMERIC,
        taux_victoires NUMERIC
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT
            p_equipe,
            COUNT(*)::INT as matchs_joues,
            SUM(CASE WHEN (equipe1 = p_equipe AND score1 > score2) 
                    OR (equipe2 = p_equipe AND score2 > score1) THEN 1 ELSE 0 END)::INT,
            SUM(CASE WHEN score1 = score2 THEN 1 ELSE 0 END)::INT,
            SUM(CASE WHEN (equipe1 = p_equipe AND score1 < score2)
                    OR (equipe2 = p_equipe AND score2 < score1) THEN 1 ELSE 0 END)::INT,
            SUM(CASE WHEN equipe1 = p_equipe THEN score1 ELSE score2 END)::INT,
            SUM(CASE WHEN equipe1 = p_equipe THEN score2 ELSE score1 END)::INT,
            (SUM(CASE WHEN equipe1 = p_equipe THEN score1 ELSE score2 END) -
             SUM(CASE WHEN equipe1 = p_equipe THEN score2 ELSE score1 END))::INT,
            ROUND(SUM(CASE WHEN equipe1 = p_equipe THEN score1::NUMERIC ELSE score2::NUMERIC END) / COUNT(*)::NUMERIC, 2),
            ROUND(SUM(CASE WHEN equipe1 = p_equipe THEN score2::NUMERIC ELSE score1::NUMERIC END) / COUNT(*)::NUMERIC, 2),
            ROUND(SUM(CASE WHEN (equipe1 = p_equipe AND score1 > score2) 
                           OR (equipe2 = p_equipe AND score2 > score1) THEN 1 ELSE 0 END)::NUMERIC 
                  / COUNT(*)::NUMERIC * 100, 2)
        FROM match_historique
        WHERE equipe1 = p_equipe OR equipe2 = p_equipe;
    END;
    $$ LANGUAGE plpgsql;


    -- =====================================================
    -- FONCTION 7 : Comparer deux équipes
    -- Retourne les différentiels et avantages
    -- =====================================================

    CREATE OR REPLACE FUNCTION comparer_equipes(p_eq1 VARCHAR, p_eq2 VARCHAR)
    RETURNS TABLE(
        equipe1 VARCHAR,
        equipe2 VARCHAR,
        ecart_fifa_percent NUMERIC,
        avantage_h2h_percent NUMERIC,
        diff_forme_percent NUMERIC,
        force_relative NUMERIC,
        equipe_favorisee VARCHAR
    ) AS $$
    DECLARE
        v_fifa1 NUMERIC;
        v_fifa2 NUMERIC;
        v_h2h NUMERIC;
        v_forme1 NUMERIC;
        v_forme2 NUMERIC;
        v_force NUMERIC;
    BEGIN
        v_fifa1 := get_score_fifa(p_eq1);
        v_fifa2 := get_score_fifa(p_eq2);
        v_h2h := get_score_h2h(p_eq1, p_eq2);
        v_forme1 := get_forme_recente(p_eq1);
        v_forme2 := get_forme_recente(p_eq2);

        v_force := (0.40 * (v_fifa1 - v_fifa2)) + (0.40 * (v_h2h - 0.5)) + (0.20 * (v_forme1 - v_forme2));

        RETURN QUERY SELECT
            p_eq1,
            p_eq2,
            ROUND((v_fifa1 - v_fifa2) * 100, 2),
            ROUND((v_h2h - 0.5) * 100, 2),
            ROUND((v_forme1 - v_forme2) * 100, 2),
            ROUND(v_force * 100, 2),
            CASE WHEN v_force > 0 THEN p_eq1 ELSE p_eq2 END;
    END;
    $$ LANGUAGE plpgsql;


    -- =====================================================
    -- FONCTION 8 : Analyser la force d'un groupe
    -- Retourne la force moyenne et les équipes par force
    -- =====================================================

    CREATE OR REPLACE FUNCTION analyser_groupe(p_id_groupe INT)
    RETURNS TABLE(
        id_groupe INT,
        equipe VARCHAR,
        score_fifa NUMERIC,
        classement_groupe INT,
        force_combinee NUMERIC
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT
            p_id_groupe,
            cg.equipe,
            e.points_fifa,
            ROW_NUMBER() OVER (ORDER BY get_score_fifa(cg.equipe) DESC)::INT,
            ROUND(get_score_fifa(cg.equipe) * 100 + get_forme_recente(cg.equipe) * 50, 2)
        FROM classement_groupe cg
        LEFT JOIN equipe e ON cg.equipe = e.nom
        WHERE cg.id_groupe = p_id_groupe
        ORDER BY get_score_fifa(cg.equipe) DESC;
    END;
    $$ LANGUAGE plpgsql;


    -- =====================================================
    -- FONCTION 9 : Obtenir les favoris du tournoi
    -- Retourne le classement des équipes par probabilité
    -- =====================================================

    CREATE OR REPLACE FUNCTION get_favoris_tournoi()
    RETURNS TABLE(
        classement INT,
        equipe VARCHAR,
        points_fifa NUMERIC,
        score_force NUMERIC,
        probabilite_titulo NUMERIC
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT
            ROW_NUMBER() OVER (ORDER BY (0.40 * get_score_fifa(e.nom) + 
                                          0.30 * get_forme_recente(e.nom) +
                                          0.30 * get_score_h2h(e.nom, 'France')) DESC)::INT,
            e.nom,
            e.points_fifa,
            ROUND(0.40 * get_score_fifa(e.nom) + 0.30 * get_forme_recente(e.nom), 2),
            ROUND((0.40 * get_score_fifa(e.nom) + 0.30 * get_forme_recente(e.nom)) * 2, 2)
        FROM equipe e
        WHERE e.nom NOT IN ('To be announced')
        ORDER BY (0.40 * get_score_fifa(e.nom) + 0.30 * get_forme_recente(e.nom) +
                  0.30 * get_score_h2h(e.nom, 'France')) DESC;
    END;
    $$ LANGUAGE plpgsql;


    -- =====================================================
    -- FONCTION 10 : Analyser un groupe (probabilités qualification)
    -- Retourne les équipes du groupe avec leur proba de qualification
    -- =====================================================

    CREATE OR REPLACE FUNCTION analyser_qualification_groupe(p_id_groupe INT)
    RETURNS TABLE(
        id_groupe INT,
        equipe VARCHAR,
        score_force NUMERIC,
        proba_qualification NUMERIC,
        place_estimee INT
    ) AS $$
    DECLARE
        v_total_force NUMERIC;
        v_count INT;
    BEGIN
        SELECT SUM(0.40 * get_score_fifa(cg.equipe) + 0.60 * get_forme_recente(cg.equipe)),
               COUNT(*)
        INTO v_total_force, v_count
        FROM classement_groupe cg
        WHERE cg.id_groupe = p_id_groupe;

        IF v_total_force IS NULL THEN v_total_force := 1; END IF;

        RETURN QUERY
        SELECT
            p_id_groupe,
            cg.equipe,
            ROUND(0.40 * get_score_fifa(cg.equipe) + 0.60 * get_forme_recente(cg.equipe), 2),
            ROUND((0.40 * get_score_fifa(cg.equipe) + 0.60 * get_forme_recente(cg.equipe)) / v_total_force * 100, 2),
            ROW_NUMBER() OVER (ORDER BY get_score_fifa(cg.equipe) DESC)::INT
        FROM classement_groupe cg
        WHERE cg.id_groupe = p_id_groupe
        ORDER BY get_score_fifa(cg.equipe) DESC;
    END;
    $$ LANGUAGE plpgsql;


    -- EXECUTION : Generer toutes les predictions initiales

    SELECT calculer_toutes_predictions();

