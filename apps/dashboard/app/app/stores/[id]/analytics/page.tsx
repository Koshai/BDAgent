import { api } from "@/lib/api";
import { SparkChart, FunnelChart } from "@/components/spark-chart";
import { IconActivity, IconCart, IconUsers } from "@/components/icons";

type Analytics = {
  conversations: number;
  messages: number;
  events: number;
  localeSplit: Array<{ locale: string | null; count: number }>;
  funnel: { chatOpened: number; productClicks: number; addToCart: number };
  series: { days: string[]; events: number[]; conversations: number[]; addToCart?: number[] };
  topPages: Array<{ path: string | null; count: number }>;
  topProducts: Array<{ count: number; product: { id: string; title: string } | null }>;
};

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await api<Analytics>(`/v1/stores/${id}/analytics`);
  const en = data.localeSplit.find((l) => l.locale === "en")?.count ?? 0;
  const bn = data.localeSplit.find((l) => l.locale === "bn")?.count ?? 0;
  const locTotal = en + bn || 1;
  const empty = data.events === 0 && data.conversations === 0;

  return (
    <>
      <div className="page-head">
        <p className="kicker">Last 30 days</p>
        <h1>Analytics</h1>
        {empty ? (
          <p className="muted">Open the storefront and send a chat. Numbers will show here.</p>
        ) : null}
      </div>

      <div className="metrics">
        <div>
          <span className="metric-label">
            <IconCart size={14} />
            Attributed carts
          </span>
          <strong>{data.funnel.addToCart}</strong>
          <em>north star</em>
        </div>
        <div>
          <span className="metric-label">
            <IconUsers size={14} />
            Conversations
          </span>
          <strong>{data.conversations}</strong>
          <em>{data.messages} messages</em>
        </div>
        <div>
          <span className="metric-label">
            <IconActivity size={14} />
            Events
          </span>
          <strong>{data.events}</strong>
          <em>page · chat · click</em>
        </div>
      </div>

      <div className="analytics-grid">
        <SparkChart values={data.series.addToCart ?? []} label="Add to cart / day" />
        <SparkChart values={data.series.conversations} label="Conversations / day" />
      </div>
      <SparkChart values={data.series.events} label="Events / day" />

      <p className="panel-title">Funnel</p>
      <FunnelChart
        steps={[
          { label: "Chat opened", value: data.funnel.chatOpened },
          { label: "Product clicks", value: data.funnel.productClicks },
          { label: "Add to cart", value: data.funnel.addToCart },
        ]}
      />

      <div className="card" style={{ marginBottom: 24 }}>
        <p className="panel-title">Language split</p>
        <div className="split">
          <div className="en" style={{ width: `${(en / locTotal) * 100}%` }} />
          <div className="bn" style={{ width: `${(bn / locTotal) * 100}%` }} />
        </div>
        <p className="muted" style={{ margin: "8px 0 0" }}>
          English {en} · বাংলা {bn}
        </p>
      </div>

      <div className="table-scroll" style={{ marginBottom: 16 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Top pages</th>
              <th className="num">Count</th>
            </tr>
          </thead>
          <tbody>
            {data.topPages.length ? (
              data.topPages.map((p) => (
                <tr key={p.path}>
                  <td>{p.path}</td>
                  <td className="num">{p.count}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="muted">
                  No page views yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Popular products</th>
              <th className="num">Count</th>
            </tr>
          </thead>
          <tbody>
            {data.topProducts.length ? (
              data.topProducts.map((p) => (
                <tr key={p.product?.id || p.count}>
                  <td>{p.product?.title || "Unknown"}</td>
                  <td className="num">{p.count}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="muted">
                  No product clicks yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
