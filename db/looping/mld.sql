equipe = (id_equipe VARCHAR(50), nom VARCHAR(50), classement VARCHAR(50), points_fifa VARCHAR(50));
groupe = (id_groupe VARCHAR(50), nom VARCHAR(50), #id_equipe);
match_historique = (id_match VARCHAR(50), date_match VARCHAR(50), equipe1 VARCHAR(50), equipe2 VARCHAR(50), score1 VARCHAR(50), score2 VARCHAR(50), tournoi VARCHAR(50), pays VARCHAR(50));
resultat = (id_resultat VARCHAR(50), score_dom VARCHAR(50), score_ext VARCHAR(50), date_saisie VARCHAR(50));
prediction = (id_prediction VARCHAR(50), proba_dom VARCHAR(50), proba_nul VARCHAR(50), proba_ext VARCHAR(50), date_calcul VARCHAR(50));
token_api = (id_token VARCHAR(50), token VARCHAR(50), date_expiration VARCHAR(50), actif VARCHAR(50));
match_cdm2026 = (id_match_wc VARCHAR(50), numero VARCHAR(50), phase VARCHAR(50), #id_prediction, #id_resultat, #id_groupe);
utilisateur = (id_utilisateur VARCHAR(50), login VARCHAR(50), password VARCHAR(50), role VARCHAR(50), #id_token);
