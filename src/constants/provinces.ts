// Dados oficiais do Brasil: Unidades Federativas, municípios e categorias de placa

export type BrazilianRegion = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';

export interface ProvinceInfo {
  code: string; // UF
  name: string; // Nome do estado
  alias: string; // Capital / nome curto
  region: BrazilianRegion;
}

/** As 27 Unidades Federativas do Brasil (26 estados + Distrito Federal). */
export const OFFICIAL_PROVINCES: ProvinceInfo[] = [
  { code: 'AC', name: 'Acre', alias: 'Rio Branco', region: 'Norte' },
  { code: 'AL', name: 'Alagoas', alias: 'Maceió', region: 'Nordeste' },
  { code: 'AP', name: 'Amapá', alias: 'Macapá', region: 'Norte' },
  { code: 'AM', name: 'Amazonas', alias: 'Manaus', region: 'Norte' },
  { code: 'BA', name: 'Bahia', alias: 'Salvador', region: 'Nordeste' },
  { code: 'CE', name: 'Ceará', alias: 'Fortaleza', region: 'Nordeste' },
  { code: 'DF', name: 'Distrito Federal', alias: 'Brasília', region: 'Centro-Oeste' },
  { code: 'ES', name: 'Espírito Santo', alias: 'Vitória', region: 'Sudeste' },
  { code: 'GO', name: 'Goiás', alias: 'Goiânia', region: 'Centro-Oeste' },
  { code: 'MA', name: 'Maranhão', alias: 'São Luís', region: 'Nordeste' },
  { code: 'MT', name: 'Mato Grosso', alias: 'Cuiabá', region: 'Centro-Oeste' },
  { code: 'MS', name: 'Mato Grosso do Sul', alias: 'Campo Grande', region: 'Centro-Oeste' },
  { code: 'MG', name: 'Minas Gerais', alias: 'Belo Horizonte', region: 'Sudeste' },
  { code: 'PA', name: 'Pará', alias: 'Belém', region: 'Norte' },
  { code: 'PB', name: 'Paraíba', alias: 'João Pessoa', region: 'Nordeste' },
  { code: 'PR', name: 'Paraná', alias: 'Curitiba', region: 'Sul' },
  { code: 'PE', name: 'Pernambuco', alias: 'Recife', region: 'Nordeste' },
  { code: 'PI', name: 'Piauí', alias: 'Teresina', region: 'Nordeste' },
  { code: 'RJ', name: 'Rio de Janeiro', alias: 'Rio de Janeiro', region: 'Sudeste' },
  { code: 'RN', name: 'Rio Grande do Norte', alias: 'Natal', region: 'Nordeste' },
  { code: 'RS', name: 'Rio Grande do Sul', alias: 'Porto Alegre', region: 'Sul' },
  { code: 'RO', name: 'Rondônia', alias: 'Porto Velho', region: 'Norte' },
  { code: 'RR', name: 'Roraima', alias: 'Boa Vista', region: 'Norte' },
  { code: 'SC', name: 'Santa Catarina', alias: 'Florianópolis', region: 'Sul' },
  { code: 'SP', name: 'São Paulo', alias: 'São Paulo', region: 'Sudeste' },
  { code: 'SE', name: 'Sergipe', alias: 'Aracaju', region: 'Nordeste' },
  { code: 'TO', name: 'Tocantins', alias: 'Palmas', region: 'Norte' },
];

export const BRAZILIAN_STATES = OFFICIAL_PROVINCES;

/** Municípios brasileiros usados no registro da placa cinza (antiga). */
export const OLD_PLATE_CITIES = [
  'São Paulo',
  'Campinas',
  'Santos',
  'Guarulhos',
  'Osasco',
  'Ribeirão Preto',
  'Sorocaba',
  'Rio de Janeiro',
  'Niterói',
  'Duque de Caxias',
  'Belo Horizonte',
  'Uberlândia',
  'Juiz de Fora',
  'Curitiba',
  'Londrina',
  'Maringá',
  'Porto Alegre',
  'Caxias do Sul',
  'Pelotas',
  'Florianópolis',
  'Joinville',
  'Brasília',
  'Goiânia',
  'Campo Grande',
  'Cuiabá',
  'Salvador',
  'Feira de Santana',
  'Recife',
  'Olinda',
  'Fortaleza',
  'Natal',
  'João Pessoa',
  'Maceió',
  'Aracaju',
  'Teresina',
  'São Luís',
  'Belém',
  'Manaus',
  'Macapá',
  'Porto Velho',
  'Rio Branco',
  'Boa Vista',
  'Palmas',
  'Vitória',
  'Outras Cidades',
];

/** Categorias de licenciamento da placa cinza brasileira. */
export const OLD_PLATE_CATEGORIES = [
  'Particular',
  'Comercial',
  'Oficial',
  'Diplomática',
  'Colecionador',
  'Motocicleta',
  'Carga',
];

/** Alfabeto oficial usado nas placas Mercosul. */
export const UNIFIED_PLATE_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

export const MERCOSUL_ALPHABET = UNIFIED_PLATE_LETTERS;
