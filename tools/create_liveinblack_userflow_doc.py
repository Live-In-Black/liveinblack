from __future__ import annotations

from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor


OUT = Path("docs/LIVE_IN_BLACK_User_Flow_Complet_V1.docx")


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_text(cell, text: str, bold: bool = False, color: str | None = None) -> None:
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(text)
    run.bold = bold
    run.font.size = Pt(9.5)
    if color:
        run.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER


def add_table(doc: Document, headers: list[str], rows: list[list[str]], widths: list[float] | None = None) -> None:
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.autofit = True
    hdr = table.rows[0].cells
    for i, h in enumerate(headers):
        set_cell_text(hdr[i], h, bold=True, color="FFFFFF")
        set_cell_shading(hdr[i], "1F1F1F")
        if widths:
            hdr[i].width = Inches(widths[i])
    for row in rows:
        cells = table.add_row().cells
        for i, value in enumerate(row):
            set_cell_text(cells[i], value)
            if widths:
                cells[i].width = Inches(widths[i])
            if len(rows) > 3 and len(table.rows) % 2 == 0:
                set_cell_shading(cells[i], "F5F5F5")
    doc.add_paragraph()


def add_bullets(doc: Document, items: list[str]) -> None:
    for item in items:
        doc.add_paragraph(item, style="List Bullet")


def add_steps(doc: Document, items: list[str]) -> None:
    for item in items:
        doc.add_paragraph(item, style="List Number")


def add_heading(doc: Document, text: str, level: int = 1) -> None:
    p = doc.add_heading(text, level=level)
    for run in p.runs:
        run.font.color.rgb = RGBColor(0, 0, 0)


def add_page(doc: Document, title: str, intro: str, bullets: list[str] | None = None) -> None:
    doc.add_page_break()
    add_heading(doc, title, 1)
    doc.add_paragraph(intro)
    if bullets:
        add_bullets(doc, bullets)


def add_footer(section, text: str) -> None:
    footer = section.footer.paragraphs[0]
    footer.text = text
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in footer.runs:
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(90, 90, 90)


def remove_paragraph_borders(paragraph) -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = p_pr.find(qn("w:pBdr"))
    if p_bdr is not None:
        p_pr.remove(p_bdr)


def remove_style_borders(style) -> None:
    p_pr = style._element.get_or_add_pPr()
    p_bdr = p_pr.find(qn("w:pBdr"))
    if p_bdr is not None:
        p_pr.remove(p_bdr)


def build_doc() -> None:
    doc = Document()
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Cm(1.8)
    section.bottom_margin = Cm(1.8)
    section.left_margin = Cm(2.0)
    section.right_margin = Cm(2.0)
    add_footer(section, "LIVE IN BLACK V1 - User Flow complet - Document de cadrage")

    styles = doc.styles
    styles["Normal"].font.name = "Aptos"
    styles["Normal"].font.size = Pt(10.5)
    styles["Normal"].paragraph_format.space_after = Pt(6)
    styles["Normal"].paragraph_format.line_spacing = 1.08
    for style_name, size in [("Title", 26), ("Heading 1", 17), ("Heading 2", 13), ("Heading 3", 11.5)]:
        style = styles[style_name]
        style.font.name = "Aptos"
        style.font.size = Pt(size)
        style.font.color.rgb = RGBColor(0, 0, 0)
        style.font.bold = True
        remove_style_borders(style)

    title = doc.add_paragraph(style="Title")
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.add_run("LIVE IN BLACK V1\nUser Flow Complet Et Fonctionnalites Par Role")
    remove_paragraph_borders(title)

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = subtitle.add_run("Document de cadrage fonctionnel pour comprendre le projet, les roles, les parcours et le perimetre de la V1 Benin")
    run.font.size = Pt(13)
    run.font.color.rgb = RGBColor(50, 50, 50)

    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    meta.add_run(f"Version de travail - {date.today().strftime('%d/%m/%Y')}\n")
    meta.add_run("Auteur fonctionnel: equipe projet LIVE IN BLACK avec consolidation produit")

    doc.add_page_break()
    add_heading(doc, "Note De Lecture", 1)
    doc.add_paragraph(
        "Ce document explique LIVE IN BLACK comme un produit complet. Il se concentre sur le fonctionnement attendu de la V1 Benin, "
        "les roles utilises par la plateforme, les parcours utilisateur, les fonctionnalites disponibles et les limites volontaires. "
        "Il distingue les besoins valides du client des anciennes idees qui ne doivent plus etre presentees comme des parcours actifs."
    )
    add_bullets(
        doc,
        [
            "La V1 est centree sur le Benin, avec des prix en FCFA XOF.",
            "Le paiement actif doit passer par FedaPay, avec FedaPay Marketplace pour la repartition entre LIVE IN BLACK et les organisateurs.",
            "Les comptes client, organisateur et prestataire doivent rester separes.",
            "Le role agent ne doit pas etre expose comme role commercial utilisateur. On parle d administrateur LIVE IN BLACK pour l interne, et de membre terrain pour les operations evenement.",
            "La video d accueil doit etre une vraie video libre de droit issue d une plateforme video, pas une image montee en video.",
        ],
    )

    doc.add_page_break()
    add_heading(doc, "Sommaire Fonctionnel", 1)
    toc_items = [
        "1. Vision generale du produit",
        "2. Perimetre V1 Benin",
        "3. Architecture des roles et comptes",
        "4. User flow visiteur",
        "5. User flow client festivalier",
        "6. User flow organisateur",
        "7. User flow prestataire",
        "8. User flow membre terrain",
        "9. User flow admin LIVE IN BLACK",
        "10. Billetterie et paiements",
        "11. Messagerie et social",
        "12. Web et mobile",
        "13. Fonctionnalites par role",
        "14. Hors perimetre V1",
        "15. Annexes de validation",
    ]
    add_bullets(doc, toc_items)

    add_page(
        doc,
        "1 Vision Generale Du Produit",
        "LIVE IN BLACK est une plateforme evenementielle construite autour de la decouverte, de la billetterie, de la relation sociale, "
        "des outils organisateur, de la visibilite prestataire, des operations terrain et de l administration interne. Le produit ne se limite "
        "pas a vendre des tickets. Il couvre tout le cycle de vie d un evenement: avant, pendant et apres.",
        [
            "Avant l evenement: decouverte, recherche, promotion, inscription, achat, codes promo, invitations et messages.",
            "Pendant l evenement: controle des billets, ventes sur place, commandes, playlist, operations staff.",
            "Apres l evenement: remboursements, suivi, statistiques, avis, historique, support et moderation.",
        ],
    )

    add_page(
        doc,
        "2 Perimetre V1 Benin",
        "Le perimetre de lancement doit rester volontairement strict. Cette discipline evite de presenter au client des fonctionnalites anciennes ou experimentales comme si elles faisaient partie de la livraison principale.",
    )
    add_table(
        doc,
        ["Sujet", "Decision V1", "Raison produit"],
        [
            ["Pays", "Benin uniquement", "Concentrer le lancement sur le marche cible de Chady."],
            ["Devise", "FCFA XOF", "Eviter les confusions EUR et les parcours non locaux."],
            ["Paiement", "FedaPay actif", "Adapter le paiement au Benin et a Mobile Money."],
            ["Marketplace", "FedaPay Marketplace", "Permettre la repartition LIVE IN BLACK et organisateur au moment du paiement."],
            ["Stripe", "Historique hors V1", "Ne pas exposer de paiement EUR ou Stripe actif."],
            ["Revente", "Hors V1", "Simplifier la billetterie et eviter les risques de controle."],
            ["Wallet cash", "Hors V1", "Ne pas creer un produit financier interne inutile au lancement."],
            ["Points fidelite", "Hors V1", "Ne pas complexifier la proposition initiale."],
        ],
        [1.5, 1.8, 3.5],
    )

    add_page(
        doc,
        "3 Architecture Des Roles",
        "La comprehension des roles est le point le plus important du projet. Chaque role correspond a une responsabilite differente. Les comptes professionnels ne doivent pas etre melanges.",
    )
    add_table(
        doc,
        ["Role", "Compte separe", "Fonction principale", "Interface principale"],
        [
            ["Visiteur", "Non", "Decouvrir la plateforme", "Accueil, recherche, fiches publiques"],
            ["Client", "Oui", "Acheter, recevoir billets, discuter", "Compte, billets, messages, profil"],
            ["Organisateur", "Oui", "Creer et gerer des evenements", "Studio organisateur"],
            ["Prestataire", "Oui", "Proposer des services", "Espace prestataire"],
            ["Membre terrain", "Non, permission contextuelle", "Operer un evenement", "Scanner, vente sur place, missions"],
            ["Admin LIVE IN BLACK", "Oui interne", "Valider, moderer, controler", "Back office admin"],
        ],
        [1.45, 1.35, 2.55, 2.0],
    )

    roles = {
        "Visiteur Non Connecte": {
            "mission": "Comprendre rapidement l offre LIVE IN BLACK et trouver une raison de creer un compte.",
            "steps": [
                "Arrive sur la page d accueil web ou mobile.",
                "Consulte les evenements mis en avant.",
                "Recherche par mot cle, categorie, ville ou organisateur.",
                "Ouvre une fiche evenement, organisateur ou prestataire.",
                "Tente une action engageante.",
                "Est redirige vers connexion ou inscription.",
            ],
            "features": [
                "Accueil public avec vraie video hero libre de droit.",
                "Catalogue evenements.",
                "Fiche evenement avec billets, FCFA, lieu et carte.",
                "Annuaire organisateurs.",
                "Annuaire prestataires.",
                "Recherche globale.",
                "Pages legales et contact.",
                "Blog cote web.",
            ],
        },
        "Client Festivalier": {
            "mission": "Acheter des billets, organiser ses sorties, discuter et presenter son QR code le jour J.",
            "steps": [
                "Cree un compte client ou se connecte.",
                "Parcourt les evenements recommandes ou recherches.",
                "Selectionne un billet ou une reservation.",
                "Paie via FedaPay en FCFA.",
                "Recoit son billet et son QR code.",
                "Presente son billet a l entree.",
                "Suit ses billets, remboursements, messages et preferences.",
            ],
            "features": [
                "Achat billet en FCFA.",
                "Codes promo.",
                "Billets QR code.",
                "Page billet publique securisee.",
                "Demandes de remboursement.",
                "Reservations de places et soldes.",
                "Evenements interesses.",
                "Organisateurs suivis.",
                "Messagerie et groupes.",
                "Amis, blocage, signalement.",
                "Parametres, notifications, export donnees et suppression compte.",
            ],
        },
        "Organisateur": {
            "mission": "Publier et piloter des evenements avec billetterie, equipe terrain, statistiques et suivi financier.",
            "steps": [
                "Cree un compte organisateur dedie.",
                "Soumet une candidature avec piece d identite.",
                "Attend la validation admin.",
                "Accede au studio organisateur.",
                "Cree un evenement au Benin.",
                "Configure billets, quotas, prix FCFA, dates et visuels.",
                "Publie et suit les ventes.",
                "Ajoute des membres terrain.",
                "Gere guestlist, promo codes, reservations et remboursements.",
            ],
            "features": [
                "Candidature organisateur.",
                "Creation et edition evenement.",
                "Billets et categories en FCFA.",
                "Medias evenement.",
                "Codes promo et codes acces.",
                "Guestlist.",
                "Staff et permissions terrain.",
                "Statistiques evenement.",
                "Boost evenement.",
                "Profil public organisateur.",
                "Suivi paiements FedaPay Marketplace et exceptions finance.",
            ],
        },
        "Prestataire": {
            "mission": "Presenter ses services aux organisateurs et recevoir des demandes dans l ecosysteme LIVE IN BLACK.",
            "steps": [
                "Cree un compte prestataire dedie.",
                "Soumet un dossier avec piece d identite et categorie de service.",
                "Attend la validation admin.",
                "Complete son profil public.",
                "Ajoute ses services, medias et zones d intervention.",
                "Recoit des messages ou demandes.",
                "Gere son abonnement et ses avis.",
            ],
            "features": [
                "Candidature prestataire.",
                "Profil public prestataire.",
                "Catalogue de services.",
                "Medias par service.",
                "Avis et reponses.",
                "Abonnement prestataire.",
                "Annuaire public.",
                "Messagerie avec organisateurs ou clients.",
            ],
        },
        "Membre Terrain Assigne": {
            "mission": "Executer une mission precise sur un evenement sans devenir un type de compte separe.",
            "steps": [
                "Est ajoute par un organisateur a un evenement.",
                "Recoit une permission precise.",
                "Voit sa mission dans ses soirees.",
                "Utilise l outil correspondant le jour J.",
                "Les actions sont journalisees pour controle.",
            ],
            "features": [
                "Scanner QR code.",
                "Controle entree valide, deja scanne ou invalide.",
                "Vente sur place si membre vendeur assigne.",
                "Commandes sur place selon permission.",
                "Playlist ou moderation DJ selon role.",
                "Liste de missions evenement.",
            ],
        },
        "Admin LIVE IN BLACK": {
            "mission": "Piloter la plateforme, valider les professionnels, moderer, controler les paiements et traiter les cas sensibles.",
            "steps": [
                "Se connecte a un compte interne admin.",
                "Consulte le tableau de bord.",
                "Traite les candidatures organisateur et prestataire.",
                "Controle les evenements, utilisateurs et signalements.",
                "Suit paiements, remboursements et exceptions.",
                "Pilote certains contenus de l accueil et les boosts.",
            ],
            "features": [
                "Dashboard admin.",
                "Validation candidatures.",
                "Gestion utilisateurs.",
                "Moderation evenements.",
                "Moderation avis et signalements.",
                "Paiements et remboursements.",
                "Exceptions finance.",
                "Demandes de suppression.",
                "Configuration accueil.",
                "Gestion boosts.",
            ],
        },
    }

    chapter_index = 4
    for role, data in roles.items():
        add_page(doc, f"{chapter_index} User Flow {role}", data["mission"])
        add_heading(doc, "Parcours principal", 2)
        add_steps(doc, data["steps"])
        add_heading(doc, "Fonctionnalites principales", 2)
        add_bullets(doc, data["features"])
        add_heading(doc, "Points de vigilance", 2)
        vigilance = [
            "Le vocabulaire doit rester coherent avec le role.",
            "Les actions exposees doivent rester dans le perimetre V1 Benin.",
            "Les ecrans web et mobile doivent raconter le meme produit meme si leur densite differe.",
        ]
        if "Admin" in role:
            vigilance.append("Les chemins techniques historiques nommes agent doivent etre compris comme administration interne.")
        if "Terrain" in role:
            vigilance.append("Ce role n est pas un compte commercial separe. Il s agit d une permission evenementielle.")
        add_bullets(doc, vigilance)
        chapter_index += 1

    detailed_pages = [
        ("10 Billetterie Et Paiement", "La billetterie est le coeur transactionnel. Elle relie le catalogue evenementiel, le paiement FedaPay, la generation du billet et le controle a l entree.",
         ["Prix en FCFA XOF.", "Paiement FedaPay.", "QR code apres confirmation.", "Webhook paiement pour finaliser la commande.", "Historique accessible depuis Mes billets."]),
        ("11 Cycle De Vie Du Billet", "Un billet passe par plusieurs etats: selection, paiement, generation, presentation, scan, remboursement possible ou archivage.",
         ["Selection du billet.", "Paiement confirme.", "Billet cree.", "QR code disponible.", "Check in sur place.", "Remboursement possible selon conditions."]),
        ("12 Remboursements", "Le remboursement doit etre cadré car il touche l argent, la confiance et la relation entre client, organisateur et plateforme.",
         ["Demande client.", "Analyse organisateur ou admin selon contexte.", "Decision acceptee ou refusee.", "Traitement via flux de paiement ou exception.", "Notification client."]),
        ("13 Reservations Et Tables", "Les reservations permettent de bloquer une place ou une table avant finalisation, avec paiement d acompte ou solde selon le modele configure.",
         ["Blocage temporaire.", "Acompte possible.", "Solde a payer.", "Expiration ou rappel.", "Controle organisateur."]),
        ("14 Guestlist Et Invitations", "La guestlist est differente d un evenement gratuit public. Elle sert aux invites VIP, presse, partenaires ou cas speciaux geres par l organisateur.",
         ["Ajout invite.", "Retrait invite.", "Suivi entree.", "Separation claire avec billetterie publique.", "Usage organise par evenement."]),
        ("15 Codes Promo Et Codes Acces", "Les codes soutiennent la promotion controlee. Ils doivent rester lies a des evenements FCFA actifs.",
         ["Creation code.", "Quota ou limite.", "Activation desactivation.", "Application au checkout.", "Suivi usage."]),
        ("16 Boost Evenement", "Le boost permet de mettre en avant un evenement dans les surfaces de decouverte.",
         ["Verification disponibilite.", "Choix position ou duree.", "Paiement.", "Activation.", "Suivi admin."]),
        ("17 Messagerie", "La messagerie garde les echanges dans la plateforme et soutient la relation sociale, commerciale et operationnelle.",
         ["Conversations directes.", "Groupes.", "Messages favoris.", "Sondages.", "Blocage et signalement."]),
        ("18 Amis Et Reseau Social", "Le reseau social aide les utilisateurs a organiser leurs sorties et partager des billets.",
         ["Demandes d amis.", "Acceptation ou refus.", "Recherche utilisateurs.", "Groupes.", "Invitations billet."]),
        ("19 Notifications", "Les notifications servent a ne pas rater une action importante.",
         ["Messages.", "Billets.", "Paiements.", "Candidatures.", "Evenements suivis.", "Remboursements."]),
        ("20 Profil Et Parametres", "Le profil concentre les informations personnelles, preferences et reglages de confidentialite.",
         ["Photo profil.", "Nom.", "Telephone +229 par defaut mais editable.", "Preferences.", "Mot de passe.", "Export et suppression."]),
        ("21 Accueil Public", "L accueil doit vendre immediatement l univers LIVE IN BLACK avec une vraie video libre de droit et des evenements clairs.",
         ["Hero video reelle.", "Evenements mis en avant.", "Organisateurs.", "Prestataires.", "Recherche rapide."]),
        ("22 Recherche Et Decouverte", "La recherche doit permettre de trouver vite un evenement, un organisateur ou un prestataire.",
         ["Recherche globale.", "Suggestions rapides.", "Fiches publiques.", "Filtres utiles sans sortir du Benin V1."]),
        ("23 Fiches Evenement", "La fiche evenement est la page de conversion.",
         ["Visuel.", "Description.", "Date et lieu.", "Billets.", "Carte.", "Organisateur.", "Actions d achat ou interet."]),
        ("24 Fiches Organisateur", "La fiche organisateur construit la confiance autour d une marque d evenement.",
         ["Bio.", "Medias.", "Evenements a venir.", "Suivre.", "Liens sociaux."]),
        ("25 Fiches Prestataire", "La fiche prestataire presente une offre professionnelle utile aux organisateurs.",
         ["Description.", "Categories.", "Catalogue.", "Medias.", "Avis.", "Contact."]),
        ("26 Onboarding Organisateur", "La candidature organisateur sert a filtrer les professionnels avant de leur donner le pouvoir de publier.",
         ["Compte dedie.", "Piece d identite.", "Brouillon.", "Soumission.", "Validation admin.", "Activation role."]),
        ("27 Onboarding Prestataire", "La candidature prestataire controle la qualite de l annuaire professionnel.",
         ["Compte dedie.", "Type de service.", "Piece d identite.", "Brouillon.", "Soumission.", "Validation admin."]),
        ("28 Studio Organisateur", "Le studio organisateur est l espace de production des evenements.",
         ["Liste evenements.", "Creation.", "Edition.", "Billetterie.", "Staff.", "Stats.", "Paiements."]),
        ("29 Gestion Staff", "Le staff est gere evenement par evenement.",
         ["Ajout membre.", "Mission scan.", "Mission vente.", "Mission service.", "Retrait membre.", "Controle permissions."]),
        ("30 Scanner", "Le scanner est l outil terrain le plus critique le jour J.",
         ["Camera.", "Lecture QR.", "Validation API.", "Etat valide.", "Etat deja scanne.", "Etat invalide."]),
        ("31 Vente Sur Place", "La vente sur place doit etre reservee a un membre vendeur assigne.",
         ["Selection billet.", "Verification FCFA.", "Vente.", "Generation billet.", "Suivi activite."]),
        ("32 Commandes Sur Place", "Les commandes permettent de gerer des consommations ou services associes a l evenement.",
         ["Panier.", "Quantites.", "Paiement.", "Servi.", "Annulation controlee."]),
        ("33 Playlist Evenement", "La playlist ajoute une couche d engagement autour de l ambiance.",
         ["Proposer morceau.", "Like.", "Moderation DJ.", "Titre en cours.", "Historique propositions."]),
        ("34 Espace Prestataire", "L espace prestataire permet au professionnel de gerer sa vitrine.",
         ["Profil.", "Catalogue.", "Medias.", "Avis.", "Abonnement.", "Messagerie."]),
        ("35 Abonnement Prestataire", "L abonnement soutient le modele economique des prestataires.",
         ["Forfait.", "Paiement FedaPay.", "Etat abonnement.", "Rappels.", "Visibilite annuaire."]),
        ("36 Avis Et Moderation Avis", "Les avis renforcent la confiance mais demandent un controle.",
         ["Depot avis.", "Reponse.", "Signalement.", "Moderation admin.", "Suppression si necessaire."]),
        ("37 Administration Candidatures", "L admin doit pouvoir traiter proprement les dossiers.",
         ["Liste dossiers.", "Detail.", "Note interne.", "Validation.", "Refus.", "Demande correction."]),
        ("38 Administration Utilisateurs", "L admin aide au support et protege la plateforme.",
         ["Recherche compte.", "Detail.", "Verification email.", "Reset mot de passe.", "Desactivation.", "Roles."]),
        ("39 Administration Evenements", "L admin surveille les evenements publies.",
         ["Liste evenements.", "Detail.", "Moderation.", "Annulation admin.", "Controle contenu."]),
        ("40 Administration Paiements", "L admin surveille remboursements, alertes et exceptions.",
         ["Alertes.", "Remboursements.", "Transactions.", "Exceptions.", "Journal decisions."]),
        ("41 Administration Accueil", "L admin peut piloter certaines mises en avant.",
         ["Configuration homepage.", "Selection contenus.", "Boosts.", "Controle editorial."]),
        ("42 Suppression De Compte", "La suppression doit etre suivie et documentee.",
         ["Demande utilisateur.", "Traitement admin.", "Validation ou refus.", "Execution controlee.", "Notification."]),
        ("43 Web", "Le web porte les parcours complets, SEO, back office et tableaux de bord riches.",
         ["Pages publiques.", "Dashboard.", "Admin.", "Blog.", "SEO.", "Docs legales."]),
        ("44 Mobile", "Le mobile porte l usage quotidien, la billetterie, le terrain et les espaces compacts.",
         ["Accueil.", "Recherche.", "Billets.", "Messages.", "Profil.", "Scanner.", "Espaces."]),
        ("45 Securite Et Permissions", "Les permissions evitent qu un utilisateur voie des actions hors de son role.",
         ["Role actif.", "Compte dedie.", "Permission evenement.", "Controle admin.", "Rate limiting."]),
        ("46 Donnees Et Conformite", "Le produit doit offrir transparence et controle personnel.",
         ["Export donnees.", "Confidentialite.", "Suppression.", "Pages legales.", "Consentement cookies."]),
        ("47 Emails", "Les emails accompagnent les moments importants.",
         ["Verification.", "Reset password.", "Billet.", "Remboursement.", "Candidature.", "Staff."]),
        ("48 Automatisations", "Les automatisations reduisent le travail manuel.",
         ["Rappels reservations.", "Rappels evenements interesses.", "Cron abonnements.", "Cron paiements.", "Webhooks."]),
        ("49 Hors V1", "Ces elements ne doivent pas etre vendus comme actifs au lancement.",
         ["Revente.", "Wallet cash.", "Points fidelite.", "Stripe actif.", "EUR actif.", "International.", "Retrait organisateur manuel."]),
        ("50 Glossaire", "Le vocabulaire doit rester stable pour eviter les malentendus.",
         ["Admin LIVE IN BLACK.", "Membre terrain.", "Membre vendeur assigne.", "Client festivalier.", "Organisateur.", "Prestataire."]),
        ("51 Questions De Validation Client", "Ces questions permettent de fermer les derniers arbitrages avec Chady.",
         ["Confirmer les forfaits prestataire.", "Confirmer les commissions LIB.", "Confirmer les categories event.", "Confirmer les templates email.", "Confirmer les permissions terrain."]),
        ("52 Checklist Recette", "La recette doit verifier que le produit raconte bien la V1 Benin.",
         ["Accueil video.", "FCFA partout.", "FedaPay actif.", "Pas revente.", "Pas Stripe public.", "Roles clairs.", "Mobile et web coherents."]),
    ]

    for title, intro, bullets in detailed_pages:
        add_page(doc, title, intro, bullets)

    doc.add_page_break()
    add_heading(doc, "53 Matrice Complete Des Roles Et Features", 1)
    add_table(
        doc,
        ["Feature", "Visiteur", "Client", "Organisateur", "Prestataire", "Terrain", "Admin"],
        [
            ["Voir accueil", "Oui", "Oui", "Oui", "Oui", "Oui", "Oui"],
            ["Acheter billet", "Non", "Oui", "Non", "Non", "Non", "Non"],
            ["Creer evenement", "Non", "Non", "Oui", "Non", "Non", "Admin controle"],
            ["Gerer profil public", "Non", "Profil perso", "Oui", "Oui", "Non", "Controle"],
            ["Scanner billet", "Non", "Non", "Selon test", "Non", "Oui", "Oui si besoin"],
            ["Vendre sur place", "Non", "Non", "Configure", "Non", "Oui si assigne", "Controle"],
            ["Valider candidature", "Non", "Non", "Non", "Non", "Non", "Oui"],
            ["Moderation", "Non", "Signaler", "Signaler", "Signaler", "Signaler", "Oui"],
            ["Paiements", "Non", "Paie", "Suit repartitions", "Abonnement", "Vente autorisee", "Controle"],
        ],
        [1.8, .75, .75, 1.05, 1.0, .85, .9],
    )

    doc.add_page_break()
    add_heading(doc, "54 Conclusion Operationnelle", 1)
    doc.add_paragraph(
        "LIVE IN BLACK V1 doit etre compris comme une plateforme complete de billetterie evenementielle et d operations terrain pour le Benin. "
        "Le produit doit rester simple dans son message: des evenements, des billets en FCFA, un paiement FedaPay, des organisateurs valides, "
        "des prestataires visibles, des membres terrain assignes et une administration LIVE IN BLACK qui controle la qualite."
    )
    doc.add_paragraph(
        "La clarte du produit depend surtout de trois choix: ne pas melanger les comptes, ne pas exposer les anciennes fonctionnalites hors V1, "
        "et utiliser le bon vocabulaire. Le client final voit une application claire. L organisateur voit un outil de gestion. Le prestataire voit une vitrine. "
        "Le membre terrain voit une mission. L admin voit une console de controle."
    )

    OUT.parent.mkdir(exist_ok=True)
    doc.save(OUT)


if __name__ == "__main__":
    build_doc()
    print(OUT)
