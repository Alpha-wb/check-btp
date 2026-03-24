export interface FicoCheck {
  id: string;
  label: string;
  category: string;
}

export interface FicoDefinition {
  type: string;
  name: string;
  shortName: string;
  phase: string;
  checks: FicoCheck[];
}

// Étapes du suivi incontournable (structure du fichier Excel SUIVI INCONTOURNABLE)
export interface EtapeSuivi {
  id: string;
  numero: number;
  name: string;
  items: { id: string; label: string; delai?: string }[];
}

export const ETAPES_SUIVI: EtapeSuivi[] = [
  {
    id: 'etape0', numero: 0, name: 'Chronologie Démarrage Travaux',
    items: [
      { id: 'e0_1', label: 'Ordre de Service (OS)' },
      { id: 'e0_2', label: 'Date de démarrage effectif' },
    ]
  },
  {
    id: 'etape1', numero: 1, name: 'Check AO (DCE/Marché)',
    items: [
      { id: 'e1_1', label: 'Contrôler date PC (nouvelles réglementations)', delai: '4 sem. après remise dossier marché' },
      { id: 'e1_2', label: 'Contrôle Plans PC / Plans DCE' },
      { id: 'e1_3', label: 'Contrôle Plans FACADES / Plans NIVEAUX' },
      { id: 'e1_4', label: 'Contrôle Plans VENTE / Plans NIVEAUX' },
      { id: 'e1_5', label: 'Contrôle Notices / CCTP / DQE' },
      { id: 'e1_6', label: 'Contrôle Études thermiques, acoustiques, sol / CCTP' },
      { id: 'e1_7', label: 'Contrôle date d\'achat du terrain / planning enveloppe' },
      { id: 'e1_8', label: 'Lecture des arrêtés et attendus du permis' },
      { id: 'e1_9', label: 'RICT rédigé ? Avis défavorable ?' },
      { id: 'e1_10', label: 'Certification ?' },
      { id: 'e1_11', label: 'Rédaction de la liste "Check DCE"' },
      { id: 'e1_12', label: 'Visite sur site (accès, voisinage, concessionnaires)' },
      { id: 'e1_13', label: 'Référé préventif' },
      { id: 'e1_14', label: 'Diagnostic amiante / plomb' },
      { id: 'e1_15', label: 'Réunion avec le bailleur, lecture Notice' },
      { id: 'e1_16', label: 'Réunion avec aménageur, lecture CCCT' },
    ]
  },
  {
    id: 'etape2', numero: 2, name: 'Lancement des Travaux',
    items: [
      { id: 'e2_1', label: 'DT/DICT', delai: 'OS - 1 mois' },
      { id: 'e2_2', label: 'Demande de branchement AEP + EAU et ELEC', delai: 'Démarrage 2 mois' },
      { id: 'e2_3', label: 'Réunion aménageurs / services techniques', delai: 'OS + 1 mois' },
      { id: 'e2_4', label: 'Réunion concessionnaires', delai: 'OS + 3 mois' },
      { id: 'e2_5', label: 'Planning exécution', delai: 'OS + 1 mois' },
      { id: 'e2_6', label: 'Réunion de lancement', delai: 'marché + 2 sem.' },
      { id: 'e2_7', label: 'Transmission plans d\'exécution' },
      { id: 'e2_8', label: 'Transmission situation de travaux' },
      { id: 'e2_9', label: 'Transmission agrément ST (IC, PPSPS)' },
      { id: 'e2_10', label: 'Encadrement de chantier' },
      { id: 'e2_11', label: 'Catalogue Option / TMA' },
      { id: 'e2_12', label: 'Réunion de chantier Hebdomadaire' },
      { id: 'e2_13', label: 'PIC (Plan d\'Installation de Chantier)', delai: 'Démarrage 1 mois' },
    ]
  },
  {
    id: 'etape3', numero: 3, name: 'Planification - Avancement',
    items: [
      { id: 'e3_1', label: 'Tableau d\'avancement' },
      { id: 'e3_2', label: 'Tableau d\'avancement selon trame' },
    ]
  },
  {
    id: 'etape4', numero: 4, name: 'Suivi de Chantier',
    items: [
      { id: 'e4_1', label: 'Tableau d\'avancement' },
      { id: 'e4_2', label: 'Fiches de choix obtenues', delai: '1 mois après GO' },
      { id: 'e4_3', label: 'Tableau TMA', delai: '1 mois après GO' },
      { id: 'e4_4', label: 'Plan carnet de décoration' },
      { id: 'e4_5', label: 'Tableau financier' },
      { id: 'e4_6', label: 'Tableau de suivi TMA' },
      { id: 'e4_7', label: 'Tableau de suivi de documents d\'exécution' },
      { id: 'e4_8', label: 'Compte rendu de chantier' },
      { id: 'e4_9', label: 'Tableau de suivi des échantillons et fiches de choix' },
      { id: 'e4_10', label: 'Planning d\'exécution tiré toutes les semaines' },
      { id: 'e4_11', label: 'Planning concessionnaires' },
    ]
  },
  {
    id: 'etape5', numero: 5, name: 'L - 4 (4 mois avant livraison)',
    items: [
      { id: 'e5_1', label: 'Planning de fin de travaux' },
      { id: 'e5_2', label: 'OPR Maître d\'Œuvre' },
      { id: 'e5_3', label: 'Contrôle des options et TMA' },
      { id: 'e5_4', label: 'Essais Acoustique' },
      { id: 'e5_5', label: 'Essais d\'Étanchéité' },
      { id: 'e5_6', label: 'Contrôle du paiement des commandes concessionnaires' },
      { id: 'e5_7', label: 'Organisation des réceptions de supports' },
      { id: 'e5_8', label: 'Raccordement ENEDIS' },
      { id: 'e5_9', label: 'Rapports CONSUEL' },
      { id: 'e5_10', label: 'Mise en service ENEDIS' },
      { id: 'e5_11', label: 'Raccordement GRDF' },
      { id: 'e5_12', label: 'Mise en service GRDF' },
    ]
  },
  {
    id: 'etape6', numero: 6, name: 'L - 1,5 (6 sem. avant livraison)',
    items: [
      { id: 'e6_1', label: 'Logements terminés' },
      { id: 'e6_2', label: 'Parties communes terminées' },
      { id: 'e6_3', label: 'Planning de Pré-livraisons (accession)' },
      { id: 'e6_4', label: 'Planning de Livraisons (accession)' },
      { id: 'e6_5', label: 'Désignation du concierge' },
      { id: 'e6_6', label: 'ENEDIS en service' },
      { id: 'e6_7', label: 'GRDF en service' },
      { id: 'e6_8', label: 'France Telecom en service' },
      { id: 'e6_9', label: 'Eaux en service' },
      { id: 'e6_10', label: 'Visite DPE' },
      { id: 'e6_11', label: 'Réception ascenseurs' },
      { id: 'e6_12', label: 'Réception Portes de Parkings' },
      { id: 'e6_13', label: 'Télévision' },
      { id: 'e6_14', label: 'Nettoyage Pré-livraisons' },
      { id: 'e6_15', label: 'Réserves OPR Levées' },
    ]
  },
  {
    id: 'etape7', numero: 7, name: 'Contrôle avant Livraisons',
    items: [
      { id: 'e7_1', label: 'Envoi du Planning de Livraison Définitif aux Entreprises' },
      { id: 'e7_2', label: 'Transmission documents à l\'attachée clientèle' },
      { id: 'e7_3', label: 'Guide du propriétaire' },
      { id: 'e7_4', label: 'DPE' },
      { id: 'e7_5', label: 'CONSUELS' },
      { id: 'e7_6', label: 'Attestation RT 2012' },
      { id: 'e7_7', label: 'Note explicative interlocuteur SAV' },
      { id: 'e7_8', label: 'Notices des équipements intérieur logement' },
      { id: 'e7_9', label: 'Clés logement / VIGIKS / Émetteurs parkings' },
      { id: 'e7_10', label: 'Préparation documents Syndic' },
      { id: 'e7_11', label: 'Bordereau de remise des clés / relevé compteurs' },
      { id: 'e7_12', label: 'PV de livraison' },
      { id: 'e7_13', label: 'Rapport Hand' },
      { id: 'e7_14', label: 'Rapport Final du Bureau de Contrôle' },
    ]
  },
  {
    id: 'etape8', numero: 8, name: 'Clôture d\'opération',
    items: [
      { id: 'e8_1', label: 'PV de réception' },
      { id: 'e8_2', label: 'PV de levée de réserves' },
      { id: 'e8_3', label: 'Réalisation du classeur client' },
      { id: 'e8_4', label: 'Réalisation du dossier informatique client' },
      { id: 'e8_5', label: 'Suivi du SAV' },
      { id: 'e8_6', label: 'Fiche d\'intervention' },
      { id: 'e8_7', label: 'Process saisie et levée des réserves' },
      { id: 'e8_8', label: 'Obtention des Quitus' },
      { id: 'e8_9', label: 'Passation SAV' },
      { id: 'e8_10', label: 'D.G.D.' },
    ]
  },
];

export const FICO_DEFINITIONS: FicoDefinition[] = [
  {
    type: 'FICO01', name: 'Fond de Fouille', shortName: 'FdFouille', phase: 'Fondations',
    checks: [
      { id: 'f01_01', label: 'Vérification de la cote du fond de fouille', category: 'Implantation' },
      { id: 'f01_02', label: 'Contrôle de la nature du sol', category: 'Sol' },
      { id: 'f01_03', label: 'Vérification de l\'absence d\'eau', category: 'Sol' },
      { id: 'f01_04', label: 'Conformité des dimensions', category: 'Dimensions' },
      { id: 'f01_05', label: 'Réception par le bureau de contrôle', category: 'Validation' },
    ]
  },
  {
    type: 'FICO02', name: 'Implantation du bâtiment', shortName: 'ImplantBat', phase: 'Fondations',
    checks: [
      { id: 'f02_01', label: 'Vérification des axes principaux', category: 'Axes' },
      { id: 'f02_02', label: 'Contrôle des cotes de niveaux', category: 'Niveaux' },
      { id: 'f02_03', label: 'Vérification des équerrages', category: 'Géométrie' },
      { id: 'f02_04', label: 'Conformité au plan de masse', category: 'Plans' },
      { id: 'f02_05', label: 'Validation des limites de propriété', category: 'Limites' },
    ]
  },
  {
    type: 'FICO03', name: 'Fondations profondes - Essais d\'impédance', shortName: 'FPImpédance', phase: 'Fondations',
    checks: [
      { id: 'f03_01', label: 'Mesure de la résistance de terre', category: 'Électricité' },
      { id: 'f03_02', label: 'Vérification de la continuité des conducteurs', category: 'Électricité' },
      { id: 'f03_03', label: 'Contrôle des liaisons équipotentielles', category: 'Sécurité' },
      { id: 'f03_04', label: 'Conformité NF C 15-100', category: 'Normes' },
    ]
  },
  {
    type: 'FICO04', name: 'Curage des réseaux', shortName: 'CurageRéso', phase: 'Réseaux',
    checks: [
      { id: 'f04_01', label: 'Inspection caméra des réseaux', category: 'Inspection' },
      { id: 'f04_02', label: 'Vérification des pentes', category: 'Pentes' },
      { id: 'f04_03', label: 'Contrôle d\'étanchéité', category: 'Étanchéité' },
      { id: 'f04_04', label: 'Raccordements conformes', category: 'Raccordement' },
    ]
  },
  {
    type: 'FICO05', name: 'Implantations en Sous-Sol et contrôle côte parking', shortName: 'ImplantSS', phase: 'Gros œuvre',
    checks: [
      { id: 'f05_01', label: 'Vérification des implantations des voiles', category: 'Voiles' },
      { id: 'f05_02', label: 'Contrôle des réservations', category: 'Réservations' },
      { id: 'f05_03', label: 'Conformité des épaisseurs', category: 'Dimensions' },
      { id: 'f05_04', label: 'Vérification du ferraillage', category: 'Structure' },
      { id: 'f05_05', label: 'Contrôle côte parking selon norme NFP91-12', category: 'Normes' },
    ]
  },
  {
    type: 'FICO06', name: 'Réalisation des chapes acoustiques', shortName: 'ChapAcoust', phase: 'Second œuvre',
    checks: [
      { id: 'f06_01', label: 'Vérification du résilient acoustique', category: 'Acoustique' },
      { id: 'f06_02', label: 'Contrôle de l\'épaisseur de chape', category: 'Dimensions' },
      { id: 'f06_03', label: 'Absence de pont phonique', category: 'Acoustique' },
      { id: 'f06_04', label: 'Planéité de la chape', category: 'Qualité' },
    ]
  },
  {
    type: 'FICO07', name: 'Réception des supports maçonnés et placo', shortName: 'RécepSuppMaconPlaco', phase: 'Second œuvre',
    checks: [
      { id: 'f07_01', label: 'Vérification de la planéité des murs', category: 'Planéité' },
      { id: 'f07_02', label: 'Contrôle de la verticalité', category: 'Verticalité' },
      { id: 'f07_03', label: 'Vérification des réservations techniques', category: 'Réservations' },
      { id: 'f07_04', label: 'État de surface conforme', category: 'Qualité' },
    ]
  },
  {
    type: 'FICO08', name: 'Nature des isolants thermiques', shortName: 'IsolantsTherm', phase: 'Second œuvre',
    checks: [
      { id: 'f08_01', label: 'Contrôle nature des doublages', category: 'Isolation' },
      { id: 'f08_02', label: 'Vérification étanchéité', category: 'Étanchéité' },
      { id: 'f08_03', label: 'Conformité GO / isolants', category: 'Normes' },
    ]
  },
  {
    type: 'FICO09', name: 'Réalisation des balcons', shortName: 'Balcons', phase: 'Gros œuvre',
    checks: [
      { id: 'f09_01', label: 'Vérification des pentes', category: 'Pentes' },
      { id: 'f09_02', label: 'Contrôle de l\'étanchéité', category: 'Étanchéité' },
      { id: 'f09_03', label: 'Conformité des garde-corps', category: 'Sécurité' },
      { id: 'f09_04', label: 'Seuil PMR conforme', category: 'PMR' },
    ]
  },
  {
    type: 'FICO10', name: 'Réception des huisseries banches', shortName: 'RécepHuisseriesBanch', phase: 'Second œuvre',
    checks: [
      { id: 'f10_01', label: 'Vérification des dimensions des baies', category: 'Dimensions' },
      { id: 'f10_02', label: 'Contrôle du niveau des appuis', category: 'Niveaux' },
      { id: 'f10_03', label: 'Équerrage des tableaux', category: 'Géométrie' },
      { id: 'f10_04', label: 'Conformité des rejingots', category: 'Étanchéité' },
    ]
  },
  {
    type: 'FICO11', name: 'Ouvrages en combles', shortName: 'Combles', phase: 'Gros œuvre',
    checks: [
      { id: 'f11_01', label: 'Position des chevêtres', category: 'Structure' },
      { id: 'f11_02', label: 'Platelage technique', category: 'Structure' },
      { id: 'f11_03', label: 'Implantation VMC / désenfumage', category: 'Ventilation' },
    ]
  },
  {
    type: 'FICO12', name: 'Ouvrages en terrasse', shortName: 'Terrasse', phase: 'Gros œuvre',
    checks: [
      { id: 'f12_01', label: 'Vérification des pentes d\'écoulement', category: 'Pentes' },
      { id: 'f12_02', label: 'Contrôle de l\'étanchéité', category: 'Étanchéité' },
      { id: 'f12_03', label: 'Conformité des relevés d\'étanchéité', category: 'Étanchéité' },
      { id: 'f12_04', label: 'Vérification des évacuations EP', category: 'Réseaux' },
      { id: 'f12_05', label: 'Protection de l\'étanchéité', category: 'Protection' },
    ]
  },
  {
    type: 'FICO13', name: 'Pose de la première menuiserie extérieure', shortName: 'MexPose1', phase: 'Second œuvre',
    checks: [
      { id: 'f13_01', label: 'Vérification de la pose des menuiseries', category: 'Menuiseries' },
      { id: 'f13_02', label: 'Contrôle du calfeutrement', category: 'Étanchéité' },
      { id: 'f13_03', label: 'Fonctionnement des ouvrants', category: 'Fonctionnement' },
      { id: 'f13_04', label: 'Conformité des vitrages', category: 'Vitrages' },
    ]
  },
  {
    type: 'FICO14', name: 'Implantation cloisonnement (selon PDV)', shortName: 'ImplantCloisons', phase: 'Second œuvre',
    checks: [
      { id: 'f14_01', label: 'Vérification du tracé des cloisons', category: 'Implantation' },
      { id: 'f14_02', label: 'Conformité aux plans d\'architecte', category: 'Plans' },
      { id: 'f14_03', label: 'Vérification des réservations portes', category: 'Réservations' },
      { id: 'f14_04', label: 'Contrôle des gaines techniques', category: 'Technique' },
    ]
  },
  {
    type: 'FICO15', name: 'Contrôle implantation appareillages plomberie et électricité', shortName: 'AppareilPlbElec', phase: 'Second œuvre',
    checks: [
      { id: 'f15_01', label: 'Position des prises électriques', category: 'Électricité' },
      { id: 'f15_02', label: 'Position des points lumineux', category: 'Électricité' },
      { id: 'f15_03', label: 'Position des arrivées d\'eau', category: 'Plomberie' },
      { id: 'f15_04', label: 'Position des évacuations', category: 'Plomberie' },
      { id: 'f15_05', label: 'Conformité NF C 15-100', category: 'Normes' },
    ]
  },
  {
    type: 'FICO16', name: 'BBC : sensibilisation à la perméabilité du bâtiment', shortName: 'SensibilPermeaBat', phase: 'Finitions',
    checks: [
      { id: 'f16_01', label: 'Sensibilisation des équipes', category: 'Formation' },
      { id: 'f16_02', label: 'Identification des points sensibles', category: 'Diagnostic' },
      { id: 'f16_03', label: 'Vérification des menuiseries extérieures', category: 'Menuiseries' },
      { id: 'f16_04', label: 'Contrôle des trappes et gaines', category: 'Étanchéité' },
    ]
  },
  {
    type: 'FICO17', name: 'BBC : Perméabilité à l\'air du bâtiment - Mesures intermédiaires', shortName: 'PermeabilitéBat', phase: 'Finitions',
    checks: [
      { id: 'f17_01', label: 'Test d\'infiltrométrie', category: 'Test' },
      { id: 'f17_02', label: 'Vérification des joints', category: 'Étanchéité' },
      { id: 'f17_03', label: 'Contrôle des traversées de parois', category: 'Étanchéité' },
      { id: 'f17_04', label: 'Conformité RT/RE', category: 'Normes' },
    ]
  },
  {
    type: 'FICO18', name: 'Support périphérique pour baignoire et douche acrylique', shortName: 'SupportBainDouch', phase: 'Second œuvre',
    checks: [
      { id: 'f18_01', label: 'Vérification de la planéité du support', category: 'Planéité' },
      { id: 'f18_02', label: 'Contrôle de l\'étanchéité SPEC', category: 'Étanchéité' },
      { id: 'f18_03', label: 'Conformité des évacuations', category: 'Plomberie' },
      { id: 'f18_04', label: 'Pente vers la bonde conforme', category: 'Pentes' },
    ]
  },
  {
    type: 'FICO19', name: 'Mise en eau des réseaux eau et chauffage', shortName: 'MiseEau', phase: 'Finitions',
    checks: [
      { id: 'f19_01', label: 'Test de pression des canalisations', category: 'Test' },
      { id: 'f19_02', label: 'Vérification de l\'absence de fuite', category: 'Étanchéité' },
      { id: 'f19_03', label: 'Contrôle des débits', category: 'Débit' },
      { id: 'f19_04', label: 'Fonctionnement des robinetteries', category: 'Fonctionnement' },
    ]
  },
  {
    type: 'FICO20', name: 'Résilient acoustique sous plinthes carrelées', shortName: 'RésilientAcoust', phase: 'Finitions',
    checks: [
      { id: 'f20_01', label: 'Vérification de la pose du résilient', category: 'Acoustique' },
      { id: 'f20_02', label: 'Contrôle des remontées en plinthe', category: 'Finitions' },
      { id: 'f20_03', label: 'Absence de pont phonique', category: 'Acoustique' },
    ]
  },
  {
    type: 'FICO21', name: 'Nettoyage et curage des réseaux extérieurs', shortName: 'NettCuragResoExt', phase: 'Finitions',
    checks: [
      { id: 'f21_01', label: 'Inspection caméra post-curage', category: 'Inspection' },
      { id: 'f21_02', label: 'Vérification des regards', category: 'Regards' },
      { id: 'f21_03', label: 'Conformité des raccordements', category: 'Raccordement' },
    ]
  },
  {
    type: 'FICO22', name: 'Conformité pompier', shortName: 'ConformPompier', phase: 'Sécurité',
    checks: [
      { id: 'f22_01', label: 'Désenfumage parking', category: 'Désenfumage' },
      { id: 'f22_02', label: 'Désenfumage palier et escalier', category: 'Désenfumage' },
      { id: 'f22_03', label: 'Extincteurs en place', category: 'Sécurité incendie' },
      { id: 'f22_04', label: 'Signalétique de sécurité', category: 'Signalétique' },
    ]
  },
  {
    type: 'FICO23', name: 'Conformité de réalisation des jardins', shortName: 'ConformJardins', phase: 'Extérieurs',
    checks: [
      { id: 'f23_01', label: 'Conformité des plantations', category: 'Paysage' },
      { id: 'f23_02', label: 'Vérification du système d\'arrosage', category: 'Arrosage' },
      { id: 'f23_03', label: 'Conformité des clôtures et limites', category: 'Limites' },
      { id: 'f23_04', label: 'Accessibilité PMR des cheminements', category: 'PMR' },
    ]
  },
  {
    type: 'FICO24', name: 'Conformité Plan de vente et Prestations', shortName: 'ConformPDV', phase: 'Livraison',
    checks: [
      { id: 'f24_01', label: 'Vérification pré-livraison logement', category: 'Logement' },
      { id: 'f24_02', label: 'Contrôle des finitions', category: 'Finitions' },
      { id: 'f24_03', label: 'Fonctionnement des équipements', category: 'Fonctionnement' },
      { id: 'f24_04', label: 'Conformité des parties communes', category: 'Commun' },
      { id: 'f24_05', label: 'Documents de livraison complets', category: 'Documents' },
    ]
  },
  {
    type: 'FICO25', name: 'Points de contrôle spécifiques', shortName: 'PointsSpécifiques', phase: 'Transverse',
    checks: [
      { id: 'f25_01', label: 'Points de contrôle spécifiques au chantier', category: 'Spécifique' },
      { id: 'f25_02', label: 'Vérifications complémentaires', category: 'Complémentaire' },
    ]
  },
];

export const PHASES = [...new Set(FICO_DEFINITIONS.map(f => f.phase))];

// Phases d'avancement pour le tableau de bord (basé sur REPORTING.docx)
export const PHASES_AVANCEMENT = [
  'Gros-Oeuvre', 'Hors d\'eau', 'Hors d\'air', 'Cloison', 'Equipement', 'Finition'
] as const;

// Structure des dates clés (basé sur REPORTING.docx)
export const DATES_CLES_TEMPLATE = [
  { id: 'fin_go', label: 'Fin du GO' },
  { id: 'hors_eau', label: 'Hors d\'eau' },
  { id: 'hors_air', label: 'Hors d\'air' },
  { id: 'choix_acq', label: 'Choix acquéreur' },
  { id: 'reception_tma', label: 'Réception TMA' },
  { id: 'temoin_logement', label: 'Témoin Logement' },
  { id: 'temoin_facade', label: 'Témoin Façade' },
  { id: 'visite_cloison', label: 'Visite cloison' },
  { id: 'opr', label: 'OPR' },
  { id: 'opl', label: 'OPL' },
  { id: 'reception', label: 'Réception' },
  { id: 'livraison', label: 'Livraison' },
] as const;
