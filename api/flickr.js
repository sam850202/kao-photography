const USER_ID = "161644745@N07";
const CATEGORIES = {
  event: ["展演","2018 第二十屆台北電影節","2019 第二十一屆台北電影節","2020野柳淨港","2021 世界音樂節","2021 新竹生活節","全球華語AV成人大賞","2022 同志大遊行","婚禮/宴會","2026 臺灣同志遊行"],
  portrait: ["人像/形象照 portrait","Mei-Fei","DUKE","Yuxuan","Fancy","Chieh-Hui","Andy","Hsiu"],
  commercial: ["還路於民募資"],
  food: ["食物攝影 / Food"],
  travel: ["2018 | 京阪奈 KANSAI","2019 | 九州 KYUSHU","2019 | 東北 TOUHOKU","2023 | 沖繩OKINAWA","2024 | 名古屋NAGOYA","2024 | 飛驒高山 HIDA TAKAYAMA","2024 | 大阪Osaka","2025 | 瀨戶內海藝術祭 Seto Naikai","2025 | 菲律賓 Philippines","2025 | 華沙Ｗarsaw","2025 | 巴黎 Paris","2025 | 布魯塞爾 Brussel","2025 | 帛琉Palau","2026 | 華沙Warsaw","2026 | 克拉科夫 Kraków"]
};
const normalize = value => String(value || "").normalize("NFKC").replace(/[\s|｜]/g,"").toLowerCase();
async function flickr(method, params) {
  const url = new URL("https://www.flickr.com/services/rest/");
  url.search = new URLSearchParams({ method, api_key: process.env.FLICKR_API_KEY, format: "json", nojsoncallback: "1", ...params });
  const response = await fetch(url, { headers: { "User-Agent": "KaoPhotographyPortfolio/1.0" } });
  if (!response.ok) throw new Error("Flickr returned HTTP " + response.status);
  const data = await response.json();
  if (data.stat !== "ok") throw new Error(data.message || "Flickr API error");
  return data;
}
async function getAlbums() {
  const data = await flickr("flickr.photosets.getList", {
    user_id: USER_ID, per_page: "500", page: "1", primary_photo_extras: "url_m,url_z,url_o"
  });
  return (data.photosets && data.photosets.photoset || []).map(set => ({
    id: String(set.id), title: set.title && (set.title._content || set.title) || "Untitled album",
    count: Number(set.photos || 0),
    cover: set.primary_photo_extras && (set.primary_photo_extras.url_z || set.primary_photo_extras.url_m || set.primary_photo_extras.url_o) || null
  }));
}
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.FLICKR_API_KEY) return res.status(503).json({ error: "網站尚未設定 Flickr API Key。請在 Vercel 環境變數加入 FLICKR_API_KEY。" });
  try {
    const albums = await getAlbums();
    if (req.query.photoset_id) {
      const selected = albums.find(a => a.id === String(req.query.photoset_id));
      if (!selected) return res.status(404).json({ error: "找不到這個公開相簿。" });
      const data = await flickr("flickr.photosets.getPhotos", {
        user_id: USER_ID, photoset_id: selected.id, per_page: "30", page: "1",
        extras: "url_m,url_z,url_o,description,date_taken,owner_name"
      });
      const photos = (data.photoset && data.photoset.photo || []).map(photo => ({
        id: String(photo.id), title: photo.title || "", medium: photo.url_m || photo.url_z || photo.url_o || null,
        large: photo.url_o || photo.url_z || photo.url_m || null,
        page: "https://www.flickr.com/photos/" + USER_ID + "/" + photo.id,
        taken: photo.datetaken || null
      })).filter(photo => photo.medium);
      return res.status(200).json({ album: selected, photos });
    }
    const category = String(req.query.category || "event");
    if (!Object.prototype.hasOwnProperty.call(CATEGORIES, category)) return res.status(400).json({ error: "未知的作品分類。" });
    const wanted = CATEGORIES[category].map(normalize);
    const matched = albums.filter(album => wanted.includes(normalize(album.title)));
    return res.status(200).json({ category, albums: matched });
  } catch (error) {
    return res.status(502).json({ error: "Flickr 讀取失敗：" + error.message });
  }
};