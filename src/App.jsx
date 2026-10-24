import React, { useEffect, useMemo, useRef, useState } from 'react';
import { categories, products, productsById } from '../shared/products.js';
import { SHOP_NAME, SHOP_TAGLINE, BANNER, formatPrice, calcDelivery, FREE_DELIVERY_FROM } from '../shared/config.js';
import { tg, isTelegram, haptic, useBackButton, loadFavorites, saveFavorites, flyToCart } from './telegram.js';
import GarmentIcon from './GarmentIcon.jsx';
import ParticleField from './ParticleField.jsx';
import { IconSearch, IconBag, IconHome, IconHeart, IconBack, IconPlus, IconCheck, IconClose } from './icons.jsx';

const PAYMENTS = [
  { id: 'card', title: 'Картой при получении', hint: 'Курьер примет оплату картой' },
  { id: 'cash', title: 'Наличными курьеру', hint: 'Подготовьте сумму без сдачи' },
];

const categoryTitle = Object.fromEntries(categories.map((c) => [c.id, c.title]));

export default function App() {
  const [screen, setScreen] = useState('catalog'); // catalog | favorites | product | cart | done
  const [prevScreen, setPrevScreen] = useState('catalog');
  const [productId, setProductId] = useState(null);
  const [category, setCategory] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState({}); // { "id|size": qty }
  const [favorites, setFavorites] = useState(loadFavorites);
  const [sheet, setSheet] = useState(null); // productId для выбора размера
  const [form, setForm] = useState(() => ({
    name: [tg?.initDataUnsafe?.user?.first_name, tg?.initDataUnsafe?.user?.last_name].filter(Boolean).join(' '),
    phone: '',
    address: '',
    comment: '',
    payment: 'card',
  }));
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(0);
  const firstName = tg?.initDataUnsafe?.user?.first_name;

  function showToast(title, sub) {
    clearTimeout(toastTimer.current);
    setToast({ title, sub, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, productId]);

  // ---------- Корзина ----------
  const items = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([key, qty]) => {
          const [id, size] = key.split('|');
          return { key, product: productsById[id], size, qty };
        })
        .filter((i) => i.product),
    [cart]
  );
  const qtyByProduct = useMemo(() => {
    const m = {};
    for (const i of items) m[i.product.id] = (m[i.product.id] || 0) + i.qty;
    return m;
  }, [items]);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.product.price, 0);
  const delivery = calcDelivery(subtotal);
  const total = subtotal + delivery;

  function addToCart(id, size, fromEl) {
    haptic('success');
    const key = `${id}|${size}`;
    setCart((c) => ({ ...c, [key]: Math.min(99, (c[key] || 0) + 1) }));
    flyToCart(fromEl);
    const p = productsById[id];
    showToast('Добавлено в корзину', `${p.title} · ${size}`);
  }
  function changeQty(key, delta) {
    haptic('light');
    setCart((c) => {
      const next = Math.max(0, Math.min(99, (c[key] || 0) + delta));
      const copy = { ...c, [key]: next };
      if (!next) delete copy[key];
      return copy;
    });
  }
  function quickAdd(p, el) {
    if (p.sizes.length === 1) addToCart(p.id, p.sizes[0], el);
    else {
      haptic('light');
      setSheet(p.id);
    }
  }
  function toggleFav(id) {
    haptic('select');
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }

  // ---------- Навигация ----------
  function go(next) {
    if (next === screen) return;
    haptic('select');
    if (screen !== 'product' && screen !== 'done') setPrevScreen(screen);
    setScreen(next);
  }
  function openProduct(id) {
    haptic('light');
    if (screen !== 'product') setPrevScreen(screen);
    setProductId(id);
    setScreen('product');
  }
  function goBack() {
    setScreen(screen === 'product' ? prevScreen : 'catalog');
  }
  useBackButton(screen === 'product' || screen === 'cart', goBack);

  // ---------- Оформление ----------
  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Укажите имя';
    if (!/^[+\d][\d\s()-]{6,}$/.test(form.phone.trim())) e.phone = 'Укажите телефон';
    if (form.address.trim().length < 5) e.address = 'Укажите адрес';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submitOrder() {
    if (sending || !items.length) return;
    if (!validate()) {
      haptic('error');
      document.querySelector('.input.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: tg?.initData || '',
          items: items.map((i) => ({ id: i.product.id, size: i.size, qty: i.qty })),
          customer: form,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Не удалось оформить заказ');
      haptic('success');
      setLastOrder({ id: data.orderId, first: items[0], count, total });
      setCart({});
      setScreen('done');
    } catch (err) {
      haptic('error');
      const msg = err.message || 'Ошибка сети';
      tg?.showAlert && isTelegram ? tg.showAlert(msg) : alert(msg);
    } finally {
      setSending(false);
    }
  }

  // ---------- Список товаров ----------
  const q = query.trim().toLowerCase();
  const visible = products.filter(
    (p) =>
      (category === 'all' || p.category === category) &&
      (!q || `${p.title} ${p.subtitle} ${categoryTitle[p.category]}`.toLowerCase().includes(q))
  );

  const field = (key) => ({
    value: form[key],
    onChange: (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
    },
    className: errors[key] ? 'input error' : 'input',
  });

  const product = productId && productsById[productId];
  const showNav = screen === 'catalog' || screen === 'favorites' || screen === 'cart';

  return (
    <div className="app">
      {/* ================= КАТАЛОГ ================= */}
      {screen === 'catalog' && (
        <div className="screen">
          <header className="top">
            <div>
              <h1 className="title">{SHOP_NAME}</h1>
              <p className="subtitle">{firstName ? `Привет, ${firstName}` : SHOP_TAGLINE}</p>
            </div>
            <div className="top-actions">
              <button className="circle" onClick={() => { haptic('light'); setSearchOpen((s) => !s); setQuery(''); }} aria-label="Поиск">
                {searchOpen ? <IconClose /> : <IconSearch />}
              </button>
              <button className="circle" onClick={() => go('cart')} aria-label="Корзина">
                <IconBag />
                {count > 0 && <span key={count} className="dot-badge bump">{count}</span>}
              </button>
            </div>
          </header>

          {!searchOpen && category === 'all' && (
            <section className="banner">
              <ParticleField cols={90} rows={46} horizon={0.46} lift={0.34} dust={22} dustTop={0.05} speed={0.8} />
              <div className="banner-shade" />
              <div className="banner-content">
                <span className="glass-chip">{BANNER.label}</span>
                <h2 className="banner-title">{BANNER.title}</h2>
                <p className="banner-text">{BANNER.text}</p>
                <button className="pill small" onClick={() => {
                  haptic('light');
                  setCategory(BANNER.category);
                  document.querySelector('.chips')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}>
                  {BANNER.button} <span className="arrow">→</span>
                </button>
              </div>
            </section>
          )}

          {searchOpen && (
            <div className="search">
              <IconSearch />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по каталогу" />
            </div>
          )}

          <nav className="chips">
            {categories.map((c) => (
              <button key={c.id} className={c.id === category ? 'chip active' : 'chip'}
                onClick={() => { haptic('select'); setCategory(c.id); }}>
                {c.title}
              </button>
            ))}
          </nav>

          {visible.length ? (
            <ProductGrid key={category + q} list={visible} qtyByProduct={qtyByProduct} onOpen={openProduct} onAdd={quickAdd} />
          ) : (
            <Empty icon={<IconSearch />} title="Ничего не найдено" text="Попробуйте другой запрос или категорию" />
          )}
        </div>
      )}

      {/* ================= ИЗБРАННОЕ ================= */}
      {screen === 'favorites' && (
        <div className="screen">
          <header className="top">
            <div>
              <h1 className="title">Избранное</h1>
              <p className="subtitle">{favorites.length ? `${favorites.length} ${plural(favorites.length, 'вещь', 'вещи', 'вещей')}` : 'Сохраняйте понравившееся'}</p>
            </div>
          </header>
          {favorites.length ? (
            <ProductGrid list={favorites.map((id) => productsById[id]).filter(Boolean)}
              qtyByProduct={qtyByProduct} onOpen={openProduct} onAdd={quickAdd} />
          ) : (
            <Empty icon={<IconHeart />} title="Пока пусто" text="Нажмите ♡ на странице товара, чтобы сохранить его"
              action={<button className="pill" onClick={() => go('catalog')}>Перейти в каталог</button>} />
          )}
        </div>
      )}

      {/* ================= ТОВАР ================= */}
      {screen === 'product' && product && (
        <ProductPage
          product={product}
          isFav={favorites.includes(product.id)}
          onFav={() => toggleFav(product.id)}
          onBack={goBack}
          onAdd={(size, el) => addToCart(product.id, size, el)}
          inCart={qtyByProduct[product.id] || 0}
          onGoCart={() => go('cart')}
        />
      )}

      {/* ================= КОРЗИНА / ОФОРМЛЕНИЕ ================= */}
      {screen === 'cart' && (
        <div className="screen">
          <header className="top start">
            {!isTelegram && <button className="circle" onClick={goBack} aria-label="Назад"><IconBack /></button>}
            <div>
              <h1 className="title">Оформление</h1>
              <p className="subtitle">Доставка и оплата</p>
            </div>
          </header>

          {items.length === 0 ? (
            <Empty icon={<IconBag />} title="Корзина пуста" text="Добавьте вещи из каталога"
              action={<button className="pill" onClick={() => go('catalog')}>Перейти в каталог</button>} />
          ) : (
            <>
              <div className="stack">
                {items.map(({ key, product: p, size, qty }) => (
                  <div key={key} className="cart-item">
                    <button className="thumb" onClick={() => openProduct(p.id)}>
                      {p.image ? <img src={p.image} alt="" /> : <GarmentIcon type={p.icon} />}
                    </button>
                    <div className="cart-info">
                      <div className="cart-title">{p.title}</div>
                      <div className="muted small">Размер {size} · {p.color}</div>
                      <div className="price">{formatPrice(p.price)}</div>
                    </div>
                    <div className="stepper">
                      <button onClick={() => changeQty(key, -1)} aria-label="Меньше">−</button>
                      <span>{qty}</span>
                      <button onClick={() => changeQty(key, 1)} aria-label="Больше">+</button>
                    </div>
                  </div>
                ))}
              </div>

              <section className="block">
                <div className="label">Получатель</div>
                <input {...field('name')} placeholder="Имя" autoComplete="name" />
                {errors.name && <div className="err">{errors.name}</div>}
                <input {...field('phone')} type="tel" inputMode="tel" placeholder="Телефон" autoComplete="tel" />
                {errors.phone && <div className="err">{errors.phone}</div>}
              </section>

              <section className="block">
                <div className="label">Адрес доставки</div>
                <input {...field('address')} placeholder="Город, улица, дом, квартира" autoComplete="street-address" />
                {errors.address && <div className="err">{errors.address}</div>}
                <textarea {...field('comment')} rows={2} placeholder="Комментарий курьеру (необязательно)" />
              </section>

              <section className="block">
                <div className="label">Способ оплаты</div>
                {PAYMENTS.map((pm) => (
                  <button key={pm.id} className={form.payment === pm.id ? 'option selected' : 'option'}
                    onClick={() => { haptic('select'); setForm((f) => ({ ...f, payment: pm.id })); }}>
                    <div>
                      <div className="option-title">{pm.title}</div>
                      <div className="muted small">{pm.hint}</div>
                    </div>
                    <span className="check">{form.payment === pm.id && <IconCheck size={14} />}</span>
                  </button>
                ))}
              </section>

              <section className="summary">
                <div className="sum-row"><span>Товары · {count}</span><span>{formatPrice(subtotal)}</span></div>
                <div className="sum-row">
                  <span>Доставка</span>
                  <span>{delivery ? formatPrice(delivery) : 'Бесплатно'}</span>
                </div>
                {FREE_DELIVERY_FROM > 0 && (
                  <div className="ship">
                    <div className="ship-bar">
                      <div className="ship-fill" style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_FROM) * 100)}%` }} />
                    </div>
                    <div className="muted small">
                      {delivery > 0
                        ? `Ещё ${formatPrice(FREE_DELIVERY_FROM - subtotal)} до бесплатной доставки`
                        : 'Бесплатная доставка — ваша'}
                    </div>
                  </div>
                )}
                <div className="sum-row total"><span>Итого</span><span>{formatPrice(total)}</span></div>
              </section>

              <button className="pill wide" disabled={sending} onClick={submitOrder}>
                {sending ? <span className="spinner" /> : 'Оформить заказ'}
              </button>
            </>
          )}
        </div>
      )}

      {/* ================= ЗАКАЗ ОФОРМЛЕН ================= */}
      {screen === 'done' && lastOrder && (
        <div className="done">
          <ParticleField />
          <div className="done-content">
            <div className="done-check"><IconCheck size={30} /></div>
            <h1 className="done-title">Заказ<br />оформлен!</h1>
            <p className="done-text">
              <b>{lastOrder.first.product.title}</b>
              {lastOrder.count > 1 && ` и ещё ${lastOrder.count - 1} ${plural(lastOrder.count - 1, 'вещь', 'вещи', 'вещей')}`} уже готовится к отправке.
              <br />Менеджер свяжется с вами для подтверждения.
            </p>
          </div>
          <div className="done-bottom">
            <div className="glass">
              <div className="thumb small">
                {lastOrder.first.product.image ? <img src={lastOrder.first.product.image} alt="" /> : <GarmentIcon type={lastOrder.first.product.icon} />}
              </div>
              <div className="cart-info">
                <div className="cart-title">{lastOrder.first.product.title}</div>
                <div className="muted small">{lastOrder.count} {plural(lastOrder.count, 'вещь', 'вещи', 'вещей')} · {formatPrice(lastOrder.total)}</div>
                <div className="muted small">ЗАКАЗ #{lastOrder.id}</div>
              </div>
              <span className="status">В обработке</span>
            </div>
            <button className="pill wide" onClick={() => { setScreen('catalog'); setCategory('all'); }}>
              Вернуться в магазин
            </button>
          </div>
        </div>
      )}

      {/* ================= НИЖНЯЯ НАВИГАЦИЯ ================= */}
      {showNav && (
        <nav className="dock">
          <span className="dock-indicator" style={{ transform: `translateX(${['catalog', 'favorites', 'cart'].indexOf(screen) * 62}px)` }} />
          <button className={screen === 'catalog' ? 'dock-btn active' : 'dock-btn'} onClick={() => go('catalog')} aria-label="Каталог"><IconHome /></button>
          <button className={screen === 'favorites' ? 'dock-btn active' : 'dock-btn'} onClick={() => go('favorites')} aria-label="Избранное">
            <IconHeart filled={screen === 'favorites'} />
            {favorites.length > 0 && screen !== 'favorites' && <span className="dot-mini" />}
          </button>
          <button className={screen === 'cart' ? 'dock-btn active' : 'dock-btn'} onClick={() => go('cart')} aria-label="Корзина" data-cart-target>
            <IconBag />
            {count > 0 && <span key={count} className="dot-badge bump">{count}</span>}
          </button>
        </nav>
      )}

      {/* ================= ТОСТ ================= */}
      {toast && (
        <div key={toast.id} className="toast">
          <span className="toast-check"><IconCheck size={14} /></span>
          <div>
            <div className="toast-title">{toast.title}</div>
            <div className="toast-sub">{toast.sub}</div>
          </div>
        </div>
      )}

      {/* ================= ВЫБОР РАЗМЕРА ================= */}
      {sheet && (
        <SizeSheet product={productsById[sheet]} onClose={() => setSheet(null)}
          onAdd={(size, el) => { addToCart(sheet, size, el); setSheet(null); }} />
      )}
    </div>
  );
}

// ---------------- Компоненты ----------------

function ProductGrid({ list, qtyByProduct, onOpen, onAdd }) {
  return (
    <main className="grid">
      {list.map((p, i) => {
        const qty = qtyByProduct[p.id] || 0;
        return (
          <article key={p.id} className={qty ? 'card active' : 'card'} onClick={() => onOpen(p.id)}
            style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
            <div className="card-cat">{categoryTitle[p.category]}</div>
            <div className="card-title">{p.title}</div>
            <div className="price">{formatPrice(p.price)}</div>
            <div className="card-media">
              {p.image ? <img src={p.image} alt={p.title} loading="lazy" /> : <GarmentIcon type={p.icon} />}
            </div>
            <button className={qty ? 'card-add in' : 'card-add'} aria-label="Добавить"
              onClick={(e) => { e.stopPropagation(); onAdd(p, e.currentTarget); }}>
              {qty ? qty : <IconPlus />}
            </button>
          </article>
        );
      })}
    </main>
  );
}

function ProductPage({ product: p, isFav, onFav, onBack, onAdd, inCart, onGoCart }) {
  const [size, setSize] = useState(p.sizes.length === 1 ? p.sizes[0] : null);
  const [shake, setShake] = useState(false);
  const [added, setAdded] = useState(false);

  function add(e) {
    if (!size) {
      haptic('error');
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    onAdd(size, e.currentTarget);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="screen product">
      <div className="hero">
        <ParticleField cols={70} rows={34} horizon={0.66} lift={0.3} dust={26} dustTop={0.08} speed={0.6} />
        <div className="hero-bar">
          {isTelegram ? <span /> : <button className="circle" onClick={onBack} aria-label="Назад"><IconBack /></button>}
          <button className={isFav ? 'circle fav' : 'circle'} onClick={onFav} aria-label="В избранное"><IconHeart filled={isFav} /></button>
        </div>
        <div className="hero-media">
          {p.image ? <img src={p.image} alt={p.title} /> : <GarmentIcon type={p.icon} />}
        </div>
        <div className="hero-code">ART. {p.code}</div>
      </div>

      <div className="product-head">
        <div>
          <div className="card-cat left">{categoryTitle[p.category]}</div>
          <h1 className="title small">{p.title}</h1>
          <p className="subtitle">{p.subtitle}</p>
        </div>
        <div className="price big">{formatPrice(p.price)}</div>
      </div>

      <section className={shake ? 'block shake' : 'block'}>
        <div className="label row">
          <span>Размер</span>
          <span className="muted">Цвет: {p.color}</span>
        </div>
        <div className="sizes">
          {p.sizes.map((s) => (
            <button key={s} className={s === size ? 'size active' : 'size'}
              onClick={() => { haptic('select'); setSize(s); }}>{s}</button>
          ))}
        </div>
      </section>

      <section className="block">
        <div className="label">Описание</div>
        <p className="text">{p.description}</p>
        <div className="spec"><span className="muted">Состав</span><span>{p.composition}</span></div>
        <div className="spec"><span className="muted">Артикул</span><span>{p.code}</span></div>
      </section>

      <div className="sticky-cta">
        {inCart > 0 && (
          <button className="pill ghost" onClick={onGoCart} data-cart-target>
            <IconBag /> {inCart}
          </button>
        )}
        <button className="pill wide" onClick={add}>
          {added ? <><IconCheck size={18} /> Добавлено</> : size ? `В корзину · ${formatPrice(p.price)}` : 'Выберите размер'}
        </button>
      </div>
    </div>
  );
}

function SizeSheet({ product: p, onClose, onAdd }) {
  const [size, setSize] = useState(null);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <div className="thumb">{p.image ? <img src={p.image} alt="" /> : <GarmentIcon type={p.icon} />}</div>
          <div className="cart-info">
            <div className="cart-title">{p.title}</div>
            <div className="muted small">{p.color}</div>
            <div className="price">{formatPrice(p.price)}</div>
          </div>
          <button className="circle" onClick={onClose} aria-label="Закрыть"><IconClose /></button>
        </div>
        <div className="label">Выберите размер</div>
        <div className="sizes">
          {p.sizes.map((s) => (
            <button key={s} className={s === size ? 'size active' : 'size'}
              onClick={() => { haptic('select'); setSize(s); }}>{s}</button>
          ))}
        </div>
        <button className="pill wide" disabled={!size} onClick={(e) => onAdd(size, e.currentTarget)}>
          {size ? 'Добавить в корзину' : 'Выберите размер'}
        </button>
      </div>
    </div>
  );
}

function Empty({ icon, title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <p className="muted">{text}</p>
      {action}
    </div>
  );
}

function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
