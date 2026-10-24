// Каталог товаров. Отредактируйте под себя.
// icon  — линейная иллюстрация, если нет фото: jacket | overshirt | knit | trousers | cap | bag
// image — ссылка на фото (необязательно, например '/img/parka.jpg' из папки public)
export const categories = [
  { id: 'all', title: 'Все' },
  { id: 'outerwear', title: 'Верхняя одежда' },
  { id: 'overshirts', title: 'Овершоты' },
  { id: 'knitwear', title: 'Трикотаж' },
  { id: 'trousers', title: 'Брюки' },
  { id: 'accessories', title: 'Аксессуары' },
];

const CLOTH_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const TROUSER_SIZES = ['46', '48', '50', '52', '54'];
const ONE_SIZE = ['OS'];

export const products = [
  {
    id: 'parka-membrane', code: '40112', category: 'outerwear', icon: 'jacket',
    title: 'Membrane Parka', subtitle: 'Нейлон с мембраной, garment dyed',
    price: 1290, color: 'Чёрный', sizes: CLOTH_SIZES,
    description: 'Удлинённая парка с капюшоном и двусторонней молнией. Окрашена после пошива — каждая вещь имеет свой оттенок.',
    composition: '100% полиамид, мембрана 10K/10K',
  },
  {
    id: 'field-jacket', code: '40207', category: 'outerwear', icon: 'jacket',
    title: 'Field Jacket', subtitle: 'Плотный хлопковый твил',
    price: 990, color: 'Олива', sizes: CLOTH_SIZES,
    description: 'Полевая куртка с четырьмя накладными карманами и утяжкой по талии.',
    composition: '100% хлопок',
  },
  {
    id: 'overshirt-ripstop', code: '10314', category: 'overshirts', icon: 'overshirt',
    title: 'Ripstop Overshirt', subtitle: 'Рипстоп, кнопки из металла',
    price: 590, color: 'Графит', sizes: CLOTH_SIZES,
    description: 'Овершот свободного кроя с нагрудными карманами на клапанах.',
    composition: '100% нейлон рипстоп',
  },
  {
    id: 'overshirt-gabardine', code: '10322', category: 'overshirts', icon: 'overshirt',
    title: 'Gabardine Overshirt', subtitle: 'Габардин, garment dyed',
    price: 540, color: 'Чёрный', sizes: CLOTH_SIZES,
    description: 'Лаконичный овершот на кнопках. Носится как рубашка или лёгкая куртка.',
    composition: '98% хлопок, 2% эластан',
  },
  {
    id: 'knit-crew', code: '50501', category: 'knitwear', icon: 'knit',
    title: 'Lambswool Crewneck', subtitle: 'Шерсть ягнёнка',
    price: 460, color: 'Антрацит', sizes: CLOTH_SIZES,
    description: 'Джемпер с круглым вырезом и рельефными манжетами.',
    composition: '100% шерсть ягнёнка',
  },
  {
    id: 'knit-half-zip', code: '50518', category: 'knitwear', icon: 'knit',
    title: 'Half-Zip Knit', subtitle: 'Мериносовая шерсть',
    price: 520, color: 'Чёрный', sizes: CLOTH_SIZES,
    description: 'Свитер с высоким воротом на молнии.',
    composition: '100% меринос',
  },
  {
    id: 'cargo-pants', code: '30409', category: 'trousers', icon: 'trousers',
    title: 'Cargo Pants', subtitle: 'Стретч-сатин',
    price: 480, color: 'Чёрный', sizes: TROUSER_SIZES,
    description: 'Карго-брюки зауженного кроя с объёмными боковыми карманами.',
    composition: '97% хлопок, 3% эластан',
  },
  {
    id: 'cap-nylon', code: '90101', category: 'accessories', icon: 'cap',
    title: 'Nylon Cap', subtitle: 'Нейлон, регулируемый ремешок',
    price: 160, color: 'Чёрный', sizes: ONE_SIZE,
    description: 'Шестипанельная кепка из технического нейлона.',
    composition: '100% полиамид',
  },
  {
    id: 'crossbody-bag', code: '90210', category: 'accessories', icon: 'bag',
    title: 'Crossbody Bag', subtitle: 'Кордура, фастекс',
    price: 290, color: 'Чёрный', sizes: ONE_SIZE,
    description: 'Компактная сумка через плечо с основным отделением и внешним карманом.',
    composition: '100% нейлон Cordura',
  },
];

export const productsById = Object.fromEntries(products.map((p) => [p.id, p]));
