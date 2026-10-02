export type Subject = {
  slug: string;
  code: string;
  name: string;
  category: string;
  description: string;
};

// Historical subject names from the previous catalog. Material availability
// is not imported because its old links and status were no longer reliable.
const legacyCatalog: Array<Omit<Subject, 'slug' | 'description'>> =[
    {
        "code":  "F",
        "name":  "Física",
        "category":  "Obligatòries"
    },
    {
        "code":  "FM",
        "name":  "Fundaments Matematics",
        "category":  "Obligatòries"
    },
    {
        "code":  "IC",
        "name":  "Introducció als Computadors",
        "category":  "Obligatòries"
    },
    {
        "code":  "PRO1",
        "name":  "Programació 1",
        "category":  "Obligatòries"
    },
    {
        "code":  "EC",
        "name":  "Estructura de Computadors",
        "category":  "Obligatòries"
    },
    {
        "code":  "M1",
        "name":  "Matemàtiques 1",
        "category":  "Obligatòries"
    },
    {
        "code":  "M2",
        "name":  "Matemàtiques 2",
        "category":  "Obligatòries"
    },
    {
        "code":  "PRO2",
        "name":  "Programació 2",
        "category":  "Obligatòries"
    },
    {
        "code":  "BD",
        "name":  "Base de dades",
        "category":  "Obligatòries"
    },
    {
        "code":  "CI",
        "name":  "Interfaces de Computadors",
        "category":  "Obligatòries"
    },
    {
        "code":  "EDA",
        "name":  "Estructura de Dades i Algorismes",
        "category":  "Obligatòries"
    },
    {
        "code":  "PE",
        "name":  "Probabilitat i Estadistica",
        "category":  "Obligatòries"
    },
    {
        "code":  "SO",
        "name":  "Sistemes Operatius",
        "category":  "Obligatòries"
    },
    {
        "code":  "AC",
        "name":  "Arquitectura de Computadors",
        "category":  "Obligatòries"
    },
    {
        "code":  "EEE",
        "name":  "Empresa i Entorn Economic",
        "category":  "Obligatòries"
    },
    {
        "code":  "IES",
        "name":  "Introducció a la Ingenieria del Software",
        "category":  "Obligatòries"
    },
    {
        "code":  "PROP",
        "name":  "Projectes de Programació",
        "category":  "Obligatòries"
    },
    {
        "code":  "XC",
        "name":  "Xarxes de Computadors",
        "category":  "Obligatòries"
    },
    {
        "code":  "IDI",
        "name":  "Interacció i Diseny d\u0027Interficies",
        "category":  "Obligatòries"
    },
    {
        "code":  "PAR",
        "name":  "Paralelisme",
        "category":  "Obligatòries"
    },
    {
        "code":  "A",
        "name":  "Algorísmia",
        "category":  "Especialitat"
    },
    {
        "code":  "G",
        "name":  "Gràfics",
        "category":  "Especialitat"
    },
    {
        "code":  "IA",
        "name":  "Intel·ligència Artificial",
        "category":  "Especialitat"
    },
    {
        "code":  "LI",
        "name":  "Lògica a la Informàtica",
        "category":  "Especialitat"
    },
    {
        "code":  "LP",
        "name":  "Llenguatges de Programació",
        "category":  "Especialitat"
    },
    {
        "code":  "TC",
        "name":  "Teoria de la Computació",
        "category":  "Especialitat"
    },
    {
        "code":  "AA",
        "name":  "Ampliació d\u0027Algorísmia",
        "category":  "Especialitat"
    },
    {
        "code":  "APA",
        "name":  "Aprenentatge Automàtic",
        "category":  "Especialitat"
    },
    {
        "code":  "CAIM",
        "name":  "Cerca i Anàlisi d\u0027Informació Massiva",
        "category":  "Especialitat"
    },
    {
        "code":  "CL",
        "name":  "Compiladors",
        "category":  "Especialitat"
    },
    {
        "code":  "CN",
        "name":  "Computació Numèrica",
        "category":  "Especialitat"
    },
    {
        "code":  "IO",
        "name":  "Investigació Operativa",
        "category":  "Especialitat"
    },
    {
        "code":  "SID",
        "name":  "Sistemes Intel·ligents Distribuïts",
        "category":  "Especialitat"
    },
    {
        "code":  "AC2",
        "name":  "Arquitectura de Computadors II",
        "category":  "Especialitat"
    },
    {
        "code":  "DSBM",
        "name":  "Disseny de Sistemes Basats en Microcomputadors",
        "category":  "Especialitat"
    },
    {
        "code":  "MP",
        "name":  "Multiprocessadors",
        "category":  "Especialitat"
    },
    {
        "code":  "PEC",
        "name":  "Projecte d\u0027Enginyeria de Computadors",
        "category":  "Especialitat"
    },
    {
        "code":  "SO2",
        "name":  "Sistemes Operatius II",
        "category":  "Especialitat"
    },
    {
        "code":  "XC2",
        "name":  "Xarxes de Computadors II",
        "category":  "Especialitat"
    },
    {
        "code":  "CASO",
        "name":  "Conceptes Avançats de Sistemes Operatius",
        "category":  "Especialitat"
    },
    {
        "code":  "CPD",
        "name":  "Centres de Processament de Dades",
        "category":  "Especialitat"
    },
    {
        "code":  "PAP",
        "name":  "Programació i Arquitectures Paral·leles",
        "category":  "Especialitat"
    },
    {
        "code":  "PCA",
        "name":  "Programació Conscient de l\u0027Arquitectura",
        "category":  "Especialitat"
    },
    {
        "code":  "PDS",
        "name":  "Processament Digital del Senyal",
        "category":  "Especialitat"
    },
    {
        "code":  "STR",
        "name":  "Sistemes de Temps Real",
        "category":  "Especialitat"
    },
    {
        "code":  "VLSI",
        "name":  "VLSI",
        "category":  "Especialitat"
    },
    {
        "code":  "AS",
        "name":  "Arquitectura del Software",
        "category":  "Especialitat"
    },
    {
        "code":  "ASW",
        "name":  "Aplicacions i Serveis Web",
        "category":  "Especialitat"
    },
    {
        "code":  "DBD",
        "name":  "Disseny de Bases de Dades",
        "category":  "Especialitat"
    },
    {
        "code":  "ER",
        "name":  "Enginyeria de Requisits",
        "category":  "Especialitat"
    },
    {
        "code":  "GPS",
        "name":  "Gestió de Projectes de Software",
        "category":  "Especialitat"
    },
    {
        "code":  "PES",
        "name":  "Projecte d\u0027Enginyeria del Software",
        "category":  "Especialitat"
    },
    {
        "code":  "CAP",
        "name":  "Conceptes Avançats de Programació",
        "category":  "Especialitat"
    },
    {
        "code":  "CBDE",
        "name":  "Conceptes per a Bases de Dades Especialitzades",
        "category":  "Especialitat"
    },
    {
        "code":  "CSI",
        "name":  "Conceptes de Sistemes d\u0027Informació",
        "category":  "Especialitat"
    },
    {
        "code":  "ECSDI",
        "name":  "Enginyeria del Coneixement i Sistemes Distribuïts Intel·ligents",
        "category":  "Especialitat"
    },
    {
        "code":  "SIM",
        "name":  "Simulació",
        "category":  "Especialitat"
    },
    {
        "code":  "SOAD",
        "name":  "Sistemes Operatius per a Aplicacions Distribuïdes",
        "category":  "Especialitat"
    },
    {
        "code":  "ADEI",
        "name":  "Anàlisi de Dades i Explotació de la Informació",
        "category":  "Especialitat"
    },
    {
        "code":  "DSI",
        "name":  "Disseny de Sistemes d\u0027Informació",
        "category":  "Especialitat"
    },
    {
        "code":  "NE",
        "name":  "Negoci Electrònic",
        "category":  "Especialitat"
    },
    {
        "code":  "PSI",
        "name":  "Projecte de Sistemes d\u0027Informació",
        "category":  "Especialitat"
    },
    {
        "code":  "SIO",
        "name":  "Sistemes d\u0027Informació per a Les Organitzacions",
        "category":  "Especialitat"
    },
    {
        "code":  "ABD",
        "name":  "Administració de Bases de Dades",
        "category":  "Especialitat"
    },
    {
        "code":  "EDO",
        "name":  "Estratègia Digital a Les Organitzacions",
        "category":  "Especialitat"
    },
    {
        "code":  "MI",
        "name":  "Marquèting a Internet",
        "category":  "Especialitat"
    },
    {
        "code":  "VPE",
        "name":  "Viabilitat de Projectes Empresarials",
        "category":  "Especialitat"
    },
    {
        "code":  "ASO",
        "name":  "Administració de Sistemes Operatius",
        "category":  "Especialitat"
    },
    {
        "code":  "PI",
        "name":  "Protocols d\u0027Internet",
        "category":  "Especialitat"
    },
    {
        "code":  "PTI",
        "name":  "Projecte de Tecnologies de la Informació",
        "category":  "Especialitat"
    },
    {
        "code":  "SI",
        "name":  "Seguretat Informàtica",
        "category":  "Especialitat"
    },
    {
        "code":  "SOA",
        "name":  "Sistemes Operatius Avançats",
        "category":  "Especialitat"
    },
    {
        "code":  "TXC",
        "name":  "Tecnologies de Xarxes de Computadors",
        "category":  "Especialitat"
    },
    {
        "code":  "AD",
        "name":  "Aplicacions Distribuïdes",
        "category":  "Especialitat"
    },
    {
        "code":  "IM",
        "name":  "Internet Mòbil",
        "category":  "Especialitat"
    },
    {
        "code":  "SDX",
        "name":  "Sistemes Distribuïts en Xarxa",
        "category":  "Especialitat"
    },
    {
        "code":  "TCI",
        "name":  "Transmissió i Codificació de la Informació",
        "category":  "Especialitat"
    },
    {
        "code":  "APC",
        "name":  "Arquitectura del PC",
        "category":  "Optatives"
    },
    {
        "code":  "APSS",
        "name":  "Habilitats Acadèmiques i Professionals d\u0027Expressió Oral en Anglès",
        "category":  "Optatives"
    },
    {
        "code":  "ASDP",
        "name":  "Habilitats Acadèmiques Pel Desenvolupament de Projectes en Anglès",
        "category":  "Optatives"
    },
    {
        "code":  "ASMI",
        "name":  "Aspectes Socials i Mediambientals de la Informàtica",
        "category":  "Optatives"
    },
    {
        "code":  "C",
        "name":  "Criptografia",
        "category":  "Optatives"
    },
    {
        "code":  "CCQ",
        "name":  "Computació i Criptografia Quàntiques",
        "category":  "Optatives"
    },
    {
        "code":  "CDI",
        "name":  "Compressió de Dades i Imatges",
        "category":  "Optatives"
    },
    {
        "code":  "DCS",
        "name":  "Disseny de Corbes i Superfícies",
        "category":  "Optatives"
    },
    {
        "code":  "FDM",
        "name":  "Física dels Dispositius de Memòria",
        "category":  "Optatives"
    },
    {
        "code":  "FOMAR",
        "name":  "Física Orientada a la Modelització i l\u0027Animació Realista",
        "category":  "Optatives"
    },
    {
        "code":  "GEOC",
        "name":  "Geometria Computacional",
        "category":  "Optatives"
    },
    {
        "code":  "MD",
        "name":  "Mineria de Dades",
        "category":  "Optatives"
    },
    {
        "code":  "PAE",
        "name":  "Projecte Aplicat d\u0027Enginyeria",
        "category":  "Optatives"
    },
    {
        "code":  "ROB",
        "name":  "Robòtica",
        "category":  "Optatives"
    },
    {
        "code":  "SLDS",
        "name":  "Software Lliure i Desenvolupament Social",
        "category":  "Optatives"
    },
    {
        "code":  "TGA",
        "name":  "Targetes Gràfiques i Acceleradors",
        "category":  "Optatives"
    },
    {
        "code":  "VC",
        "name":  "Visió per Computador",
        "category":  "Optatives"
    },
    {
        "code":  "VJ",
        "name":  "Videojocs",
        "category":  "Optatives"
    },
    {
        "code":  "WSE",
        "name":  "Habilitats d\u0027Expressió Escrita en Anglès per a l\u0027Enginyeria",
        "category":  "Optatives"
    }
];

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const cleanedNames: Record<string, string> = {
  FM: 'Fonaments Matemàtics',
  PE: 'Probabilitat i Estadística',
  EEE: 'Empresa i Entorn Econòmic',
  IES: 'Introducció a l’Enginyeria del Software',
  IDI: 'Interacció i Disseny d’Interfícies',
  MI: 'Màrqueting a Internet',
};

export const subjects: Subject[] = legacyCatalog.map((subject) => {
  const name = cleanedNames[subject.code] ?? subject.name;
  return {
    ...subject,
    name,
    slug: subject.code.toLowerCase() + '-' + slugify(name),
    description: 'Materials compartits per a ' + name + '.',
  };
});

const featuredCodes = ['F', 'FM', 'M2', 'BD', 'EDA', 'PE', 'SO', 'EEE', 'XC'];
export const featuredSubjects = featuredCodes
  .map((code) => subjects.find((subject) => subject.code === code))
  .filter((subject): subject is Subject => Boolean(subject));
