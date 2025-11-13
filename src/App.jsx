import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_BACKEND_URL || "";

function useApi(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`${API}${path}`)
      .then((r) => r.json())
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, deps);
  return { data, loading, error };
}

function Header({ cartCount }) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-600 text-white grid place-items-center font-bold">HC</div>
          <div className="font-extrabold text-xl">The Herbal Chicken</div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-sm px-3 py-1.5 rounded-full border border-neutral-300 hover:bg-neutral-50">Login</button>
          <div className="relative">
            <span className="px-3 py-1.5 rounded-full bg-black text-white text-sm">Cart ({cartCount})</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function BannerStrip() {
  const { data } = useApi("/api/banners", []);
  const banners = data || [];
  if (!banners.length) return null;
  return (
    <div className="max-w-6xl mx-auto px-4 mt-4 grid sm:grid-cols-2 gap-4">
      {banners.map((b, i) => (
        <div key={i} className="aspect-[16/9] rounded-xl overflow-hidden border">
          <img src={b.image_url} alt={b.title || "Banner"} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
}

function Categories({ active, setActive }) {
  const cats = ["Chicken", "Mutton", "Fish", "Eggs"];
  return (
    <div className="max-w-6xl mx-auto px-4 mt-6 flex gap-2 overflow-x-auto pb-2">
      {cats.map((c) => (
        <button
          key={c}
          onClick={() => setActive(c)}
          className={`px-4 py-2 rounded-full border text-sm whitespace-nowrap ${active === c ? "bg-red-600 text-white border-red-600" : "bg-white text-black border-neutral-300 hover:bg-neutral-50"}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden hover:shadow-md transition">
      <div className="aspect-square bg-neutral-100">
        <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <div className="font-semibold line-clamp-1">{product.title}</div>
        <div className="text-sm text-neutral-600 line-clamp-2 min-h-[2.5rem]">{product.description || "Freshly cut and hygienically packed."}</div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-lg font-bold">₹{Number(product.price).toFixed(2)}</div>
          <button onClick={onAdd} className="px-3 py-1.5 rounded-full bg-black text-white text-sm hover:bg-red-600">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function Products({ category, onAdd }) {
  const { data, loading } = useApi(`/api/products?category=${encodeURIComponent(category)}`, [category]);
  const products = data || [];
  return (
    <div className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {loading && Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-white h-64 animate-pulse" />
      ))}
      {!loading && products.map((p) => (
        <ProductCard key={p._id || p.sku || p.title} product={p} onAdd={() => onAdd(p)} />
      ))}
    </div>
  );
}

function Offers() {
  const { data } = useApi("/api/offers", []);
  const offers = data || [];
  if (!offers.length) return null;
  return (
    <div className="max-w-6xl mx-auto px-4 mt-8 grid sm:grid-cols-3 gap-4">
      {offers.map((o, i) => (
        <div key={i} className="rounded-xl border p-4 bg-white">
          <div className="font-semibold">{o.title}</div>
          <div className="text-sm text-neutral-600">{o.description}</div>
        </div>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-neutral-600 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>© {new Date().getFullYear()} The Herbal Chicken</div>
        <div className="flex gap-4">
          <a className="hover:text-red-600" href="#">Privacy</a>
          <a className="hover:text-red-600" href="#">Terms</a>
          <a className="hover:text-red-600" href="#">Support</a>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [active, setActive] = useState("Chicken");
  const [cart, setCart] = useState([]);

  const addToCart = (p) => {
    setCart((c) => {
      const i = c.findIndex((x) => x.product_id === (p._id || p.id));
      if (i > -1) {
        const n = [...c];
        n[i].quantity += 1;
        return n;
      }
      return [
        ...c,
        {
          product_id: p._id || p.id,
          title: p.title,
          price: Number(p.price),
          quantity: 1,
          image_url: p.image_url,
        },
      ];
    });
  };

  const cartCount = useMemo(() => cart.reduce((s, it) => s + it.quantity, 0), [cart]);

  return (
    <div className="min-h-screen bg-white text-black">
      <Header cartCount={cartCount} />
      <BannerStrip />
      <Categories active={active} setActive={setActive} />
      <Products category={active} onAdd={addToCart} />
      <Offers />
      <Footer />
    </div>
  );
}
