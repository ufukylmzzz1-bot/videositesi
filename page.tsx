"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
});

type VideoItem = {
  id: number;
  title: string;
  user: string;
  views: string;
  time: string;
  sources: {
    "360p"?: string;
    "720p"?: string;
    "1080p"?: string;
    "1440p"?: string;
  };
  thumbnail: string;
  description: string;
  categories: string[];
  uploadedHoursAgo: number;
};

type ChatMessage = {
  id: number;
  user: string;
  text: string;
  time: string;
};

const VIDEOS_PER_PAGE = 15;

const STORAGE_KEYS = {
  videos: "guest_video_site_v7_videos",
  videoChats: "guest_video_site_v7_chats",
  deletedVideoIds: "guest_video_site_v7_deleted_ids",
  adminSession: "guest_video_site_v7_admin_session",
  guestNickname: "guest_video_site_v7_guest_nickname",
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function BannerAd({ className = "" }: { className?: string }) {
  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://a.magsrv.com/ad-provider.js"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.async = true;
      script.type = "application/javascript";
      script.src = "https://a.magsrv.com/ad-provider.js";
      document.body.appendChild(script);
    }

    const t = window.setTimeout(() => {
      try {
        (window as any).AdProvider = (window as any).AdProvider || [];
        (window as any).AdProvider.push({ serve: {} });
      } catch {}
    }, 120);

    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className={`w-full flex justify-center ${className}`}>
      <ins className="eas6a97888e10" data-zoneid="5898160"></ins>
    </div>
  );
}

export default function Page() {
  const categories = [
  "Tümü",
  "Trend",
  "Yeni Eklenenler",
  "En Çok İzlenen",
  "Türk",
  "Yabancı",
  "Amatör",
  "Profesyonel",
  "HD",
  "Kısa Videolar",
  "Uzun Metraj",
  "Canlı Yayın",
  "Fetiş",
  "Roleplay",
  "Çiftler",
  "Solo",
  "Milf",
  ];

  const adminEmail = "1birtanga@gmail.com";
  const adminPassword = "Alucard111";
  const exoZoneId = "5898096";

  const categoryRef = useRef<HTMLDivElement | null>(null);
  const videoPlayAdOpenedRef = useRef<Record<number, boolean>>({});

  const initialVideos: VideoItem[] = [
    {
      id: 1,
      title: "Şehir Manzarası",
      user: "Yönetici",
      views: "12.4K görüntülenme",
      time: "2 saat önce",
      sources: {
        "360p": "https://www.w3schools.com/html/mov_bbb.mp4",
        "720p": "https://www.w3schools.com/html/mov_bbb.mp4",
        "1080p": "https://www.w3schools.com/html/mov_bbb.mp4",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80",
      description: "Örnek video içeriği.",
      categories: ["Tümü", "Editörün Seçtikleri", "Trend"],
      uploadedHoursAgo: 2,
    },
  ];

  const [deletedVideoIds, setDeletedVideoIds] = useState<number[]>(() =>
    readStorage<number[]>(STORAGE_KEYS.deletedVideoIds, [])
  );

  const [videos, setVideos] = useState<VideoItem[]>(() => {
    if (typeof window === "undefined") return initialVideos;

    const savedVideos = readStorage<VideoItem[] | null>(STORAGE_KEYS.videos, null);
    const deletedIds = readStorage<number[]>(STORAGE_KEYS.deletedVideoIds, []);

    if (savedVideos && Array.isArray(savedVideos)) {
      return savedVideos.filter((video) => !deletedIds.includes(video.id));
    }

    return initialVideos.filter((video) => !deletedIds.includes(video.id));
  });

  const [videoChats, setVideoChats] = useState<Record<number, ChatMessage[]>>(() => {
    const savedChats = readStorage<Record<number, ChatMessage[]> | null>(
      STORAGE_KEYS.videoChats,
      null
    );

    if (savedChats) return savedChats;

    return {
      1: [
        { id: 1, user: "Misafir-1", text: "Çok iyi video olmuş.", time: "Şimdi" },
        { id: 2, user: "Misafir-2", text: "Kalite güzel görünüyor.", time: "Şimdi" },
      ],
    };
  });

  const [page, setPage] = useState<"home" | "upload" | "video" | "adminLogin">("home");
  const [isAdmin, setIsAdmin] = useState<boolean>(() =>
    readStorage<boolean>(STORAGE_KEYS.adminSession, false)
  );
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVideoId, setSelectedVideoId] = useState<number>(1);
  const [chatInput, setChatInput] = useState("");
  const [guestName, setGuestName] = useState<string>(() =>
    readStorage<string>(
      STORAGE_KEYS.guestNickname,
      `Misafir-${Math.floor(1000 + Math.random() * 9000)}`
    )
  );
  const [viewers, setViewers] = useState(2);
  const [selectedQuality, setSelectedQuality] = useState<
    "360p" | "720p" | "1080p" | "1440p"
  >("720p");
  const [message, setMessage] = useState("");
  const [adminForm, setAdminForm] = useState({
    email: "",
    password: "",
  });

  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    videoFile: null as File | null,
    thumbnailFile: null as File | null,
    categories: ["Yeni Eklenenler"] as string[],
  });

  useEffect(() => {
    writeStorage(STORAGE_KEYS.guestNickname, guestName);
  }, [guestName]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.adminSession, isAdmin);
  }, [isAdmin]);

  useEffect(() => {
    const handleHash = () => {
      if (typeof window === "undefined") return;

      if (window.location.hash === "#admin" && !isAdmin) {
        setPage("adminLogin");
        return;
      }

      if (!isAdmin && page === "adminLogin" && window.location.hash !== "#admin") {
        setPage("home");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [isAdmin, page]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.deletedVideoIds, deletedVideoIds);
  }, [deletedVideoIds]);

  useEffect(() => {
    const filtered = videos.filter((video) => !deletedVideoIds.includes(video.id));
    writeStorage(STORAGE_KEYS.videos, filtered);
  }, [videos, deletedVideoIds]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.videoChats, videoChats);
  }, [videoChats]);

  useEffect(() => {
    if (!showSearch && searchTerm) {
      setSearchTerm("");
    }
  }, [showSearch, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm]);

  const filteredVideos = useMemo(() => {
    let filtered = videos.filter((video) => !deletedVideoIds.includes(video.id));

    if (selectedCategory !== "Tümü") {
      filtered = filtered.filter((video) => video.categories.includes(selectedCategory));
    }

    if (searchTerm.trim()) {
      filtered = filtered.filter((video) =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [videos, deletedVideoIds, selectedCategory, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE));

  const activeVideos = useMemo(() => {
    const start = (currentPage - 1) * VIDEOS_PER_PAGE;
    return filteredVideos.slice(start, start + VIDEOS_PER_PAGE);
  }, [filteredVideos, currentPage]);

  const selectedVideo = useMemo(() => {
    const filtered = videos.filter((video) => !deletedVideoIds.includes(video.id));
    return filtered.find((video) => video.id === selectedVideoId) || filtered[0];
  }, [videos, deletedVideoIds, selectedVideoId]);

  const relatedVideos = useMemo(() => {
    return videos
      .filter((video) => !deletedVideoIds.includes(video.id))
      .filter((video) => video.id !== selectedVideoId)
      .slice(0, 15);
  }, [videos, deletedVideoIds, selectedVideoId]);

  const selectedVideoMessages = useMemo(() => {
    return selectedVideo ? videoChats[selectedVideo.id] || [] : [];
  }, [selectedVideo, videoChats]);

  const currentVideoSrc = useMemo(() => {
    if (!selectedVideo) return "";

    return (
      selectedVideo.sources[selectedQuality] ||
      selectedVideo.sources["720p"] ||
      selectedVideo.sources["360p"] ||
      selectedVideo.sources["1080p"] ||
      selectedVideo.sources["1440p"] ||
      ""
    );
  }, [selectedVideo, selectedQuality]);

  const goHome = () => {
    setPage("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openVideoRoom = (videoId: number) => {
    setSelectedVideoId(videoId);
    setSelectedQuality("720p");
    setPage("video");
    setViewers((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

const handleAdminLogin = (e: React.FormEvent) => {
  e.preventDefault();

  if (
    adminForm.email.trim() === adminEmail &&
    adminForm.password.trim() === adminPassword
  ) {
    setIsAdmin(true);
    setMessage("Yönetici girişi başarılı.");
    setAdminForm({ email: "", password: "" });
      

      if (typeof window !== "undefined") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    setPage("home");
    return;
  }

  setMessage("Yönetici bilgileri hatalı.");
};


const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://158.220.108.252:4000/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload başarısız");
  }

  const data = await res.json();

  if (!data?.url) {
    throw new Error("URL dönmedi");
  }

  return data.url;
};
  const handleUpload = async (e: React.FormEvent) => {
    
  e.preventDefault();

  if (!isAdmin) {
    setMessage("Sadece yönetici video yükleyebilir.");
    return;
  }

  if (videos.length >= 75) {
    setMessage("Şimdilik en fazla 75 video eklenebilir.");
    return;
  }

  if (!uploadForm.title || !uploadForm.videoFile || !uploadForm.thumbnailFile) {
    setMessage("Video başlığı, video dosyası ve kapak fotoğrafı zorunlu.");
    return;
  }

  const selectedUploadCategories =
    uploadForm.categories.length > 0
      ? ["Tümü", ...uploadForm.categories.filter((item) => item !== "Tümü")]
      : ["Tümü"];

  try {
    setMessage("Yükleniyor...");

    const videoUrl = await uploadToCloudinary(uploadForm.videoFile);
    const thumbnailUrl = await uploadToCloudinary(uploadForm.thumbnailFile);

    const newVideo: VideoItem = {
      id: Date.now(),
      title: uploadForm.title,
      user: "Yönetici",
      views: "Yeni yüklendi",
      time: "Az önce",
      sources: {
        "720p": videoUrl,
        "1080p": videoUrl,
      },
      thumbnail: thumbnailUrl,
      description: uploadForm.description || "Yeni yönetici videosu",
      categories: selectedUploadCategories,
      uploadedHoursAgo: 0,
    };

    setVideos((prev) => [newVideo, ...prev]);
    setVideoChats((prev) => ({ ...prev, [newVideo.id]: [] }));
    setUploadForm({
      title: "",
      description: "",
      videoFile: null,
      thumbnailFile: null,
      categories: ["Yeni Eklenenler"],
    });
    setMessage("Video başarıyla eklendi.");
    setPage("home");
    setCurrentPage(1);
  } catch (error) {
    console.error(error);
    setMessage("Yükleme sırasında hata oluştu.");
  }
};

  const deleteVideo = (videoId: number) => {
    if (!isAdmin) return;

    setVideos((prev) => prev.filter((video) => video.id !== videoId));
    setDeletedVideoIds((prev) => (prev.includes(videoId) ? prev : [...prev, videoId]));

    setVideoChats((prev) => {
      const updated = { ...prev };
      delete updated[videoId];
      return updated;
    });

    if (selectedVideoId === videoId) {
      const remaining = videos
        .filter((video) => video.id !== videoId)
        .filter((video) => !deletedVideoIds.includes(video.id));

      setPage("home");
      setSelectedVideoId(remaining[0]?.id ?? 1);
    }

    setMessage("Video silindi.");
  };

  const deleteChatMessage = (videoId: number, messageId: number) => {
    if (!isAdmin) return;

    setVideoChats((prev) => ({
      ...prev,
      [videoId]: (prev[videoId] || []).filter((item) => item.id !== messageId),
    }));

    setMessage("Mesaj silindi.");
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    setPage("home");
    setMessage("Yönetici çıkışı yapıldı.");
    if (typeof window !== "undefined") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVideo || !chatInput.trim()) return;

    const finalGuestName =
      guestName.trim() || `Misafir-${Math.floor(1000 + Math.random() * 9000)}`;

    const newMessage: ChatMessage = {
      id: Date.now(),
      user: finalGuestName,
      text: chatInput.trim(),
      time: "Şimdi",
    };

    setVideoChats((prev) => ({
      ...prev,
      [selectedVideo.id]: [...(prev[selectedVideo.id] || []), newMessage],
    }));

    setChatInput("");
  };

  const formatHours = (hours: number) => {
    if (hours <= 0) return "Az önce yüklendi";
    return `${hours} saat önce yüklendi`;
  };

  const openPlayAdOnce = (videoId: number) => {
    if (typeof window === "undefined") return;
    if (videoPlayAdOpenedRef.current[videoId]) return;

    videoPlayAdOpenedRef.current[videoId] = true;

    const existing = document.getElementById("exo-play-pop");
    if (existing) {
      existing.remove();
    }

    const s = document.createElement("script");
    s.id = "exo-play-pop";
    s.src = "https://a.pemsrv.com/popunder1000.js";
    s.async = true;
    s.type = "application/javascript";

    s.setAttribute("data-exo-ads_host", "a.pemsrv.com");
    s.setAttribute("data-exo-syndication_host", "s.pemsrv.com");
    s.setAttribute("data-exo-idzone", exoZoneId);
    s.setAttribute("data-exo-popup_fallback", "false");
    s.setAttribute("data-exo-popup_force", "true");
    s.setAttribute("data-exo-chrome_enabled", "true");
    s.setAttribute("data-exo-new_tab", "true");
    s.setAttribute("data-exo-frequency_period", "720");
    s.setAttribute("data-exo-frequency_count", "1");
    s.setAttribute("data-exo-trigger_method", "3");
    s.setAttribute("data-exo-trigger_class", "");
    s.setAttribute("data-exo-trigger_delay", "0");
    s.setAttribute("data-exo-capping_enabled", "true");
    s.setAttribute("data-exo-tcf_enabled", "true");
    s.setAttribute("data-exo-only_inline", "false");

    document.body.appendChild(s);

    setTimeout(() => {
      try {
        document.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
      } catch {}
    }, 120);
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-black w-full overflow-x-hidden">
      <div className="w-full min-h-screen bg-black flex flex-col overflow-x-hidden">
        <header className="sticky top-0 z-20 w-full overflow-x-hidden bg-white/95 backdrop-blur border-b border-[#e5e5e5] px-3 sm:px-4 py-3">
          <div className="mx-auto w-full max-w-[1400px]">
            <div className="flex items-center justify-between gap-3 relative min-h-[48px]">
              <div className="w-10 shrink-0" />

              <button
                onClick={goHome}
                className="absolute left-1/2 -translate-x-1/2 max-w-[180px]"
              >
                <div className="flex items-end justify-center">
                  <span
                    className={`${dancingScript.className} text-[32px] sm:text-[38px] lg:text-[42px] leading-none text-black`}
                  >
                    1
                  </span>
                  <span
                    className={`${dancingScript.className} text-[36px] sm:text-[43px] lg:text-[47px] leading-none text-red-600 -ml-1`}
                  >
                    T
                  </span>
                  <span
                    className={`${dancingScript.className} text-[32px] sm:text-[38px] lg:text-[42px] leading-none text-black -ml-1`}
                  >
                    anga
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                {isAdmin ? (
                  <>
                    <span className="text-xs text-[#d4af37] hidden sm:block">
                      Yönetici
                    </span>
                    <button
                      onClick={() => setPage("upload")}
                      className="bg-[#d4af37] hover:opacity-90 transition text-black px-3 py-2 rounded-full text-xs font-medium"
                    >
                      Yükle
                    </button>
                    <button
                      onClick={logoutAdmin}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#d4af37] px-3 py-2 rounded-full text-xs"
                    >
                      Çıkış
                    </button>
                  </>
                ) : (
                  <div className="w-10" />
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2" ref={categoryRef}>
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                  className="flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-end flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  {showSearch ? (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 180, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden max-w-[55vw] sm:max-w-none"
                    >
                      <input
                        type="text"
                        placeholder="Video ara"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        className="w-full rounded-full bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <button
                  onClick={() => {
                    if (showSearch && searchTerm.trim()) {
                      setSearchTerm("");
                      setShowSearch(false);
                      return;
                    }
                    setShowSearch((prev) => !prev);
                  }}
                  className="ml-2 flex h-10 w-10 items-center justify-center shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {message && (
          <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-4">
            <div className="mt-3 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-[#f3e3ac]">
              {message}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto pb-24">
          <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                {page === "adminLogin" && !isAdmin && (
                  <div className="p-0 sm:p-1 space-y-4 mt-4">
                    <form
                      onSubmit={handleAdminLogin}
                      className="space-y-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 max-w-xl mx-auto"
                    >
                      <h2 className="text-base font-semibold text-[#d4af37]">
                        Yönetici Girişi
                      </h2>

                      <p className="text-xs text-zinc-400">
                        Bu panel sadece gizli bağlantı ile açılır.
                      </p>

                      <input
                        type="email"
                        placeholder="Admin e-posta"
                        value={adminForm.email}
                        onChange={(e) =>
                          setAdminForm({ ...adminForm, email: e.target.value })
                        }
                        className="w-full rounded-xl bg-[#111111] border border-[#2a2a2a] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                      />

                      <input
                        type="password"
                        placeholder="Admin şifre"
                        value={adminForm.password}
                        onChange={(e) =>
                          setAdminForm({ ...adminForm, password: e.target.value })
                        }
                        className="w-full rounded-xl bg-[#111111] border border-[#2a2a2a] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                      />

                      <button className="w-full bg-[#d4af37] text-black py-3 rounded-xl font-medium">
                        Giriş Yap
                      </button>
                    </form>
                  </div>
                )}

                {page === "upload" && isAdmin && (
                  <div className="mt-4">
                    <form
                      onSubmit={handleUpload}
                      className="space-y-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4"
                    >
                      <div>
                        <h2 className="text-base font-semibold text-[#d4af37]">
                          Video yükleme paneli
                        </h2>
                        <p className="text-xs text-zinc-400 mt-1">
                          Sayfa başına 15 video gösterilir.
                        </p>
                      </div>

                      <input
                        type="text"
                        placeholder="Video başlığı"
                        value={uploadForm.title}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, title: e.target.value })
                        }
                        className="w-full rounded-xl bg-[#111111] border border-[#2a2a2a] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                      />

                      <textarea
                        placeholder="Video açıklaması"
                        value={uploadForm.description}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            description: e.target.value,
                          })
                        }
                        className="w-full rounded-xl bg-[#111111] border border-[#2a2a2a] px-3 py-3 text-sm text-white outline-none min-h-24 placeholder:text-zinc-500"
                      />

                      <div className="space-y-2 rounded-xl border border-[#2a2a2a] bg-[#111111] px-3 py-3">
                        <p className="text-sm text-[#d4af37]">Kategori seç</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {categories
                            .filter((item) => item !== "Tümü")
                            .map((item) => {
                              const checked = uploadForm.categories.includes(item);

                              return (
                                <label
                                  key={item}
                                  className="flex items-center gap-2 text-sm text-zinc-300"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setUploadForm({
                                          ...uploadForm,
                                          categories: [...uploadForm.categories, item],
                                        });
                                      } else {
                                        setUploadForm({
                                          ...uploadForm,
                                          categories: uploadForm.categories.filter(
                                            (category) => category !== item
                                          ),
                                        });
                                      }
                                    }}
                                  />
                                  {item}
                                </label>
                              );
                            })}
                        </div>
                      </div>

                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            videoFile: e.target.files?.[0] || null,
                          })
                        }
                        className="w-full rounded-xl bg-[#111111] border border-[#2a2a2a] px-3 py-3 text-sm text-white outline-none"
                      />

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            thumbnailFile: e.target.files?.[0] || null,
                          })
                        }
                        className="w-full rounded-xl bg-[#111111] border border-[#2a2a2a] px-3 py-3 text-sm text-white outline-none"
                      />

                      <button className="w-full bg-[#d4af37] text-black py-3 rounded-xl font-medium">
                        Videoyu Yayınla
                      </button>
                    </form>
                  </div>
                )}

                {page === "home" && (
                  <div className="space-y-4 pt-4">
                    <BannerAd className="rounded-2xl overflow-hidden border border-[#2a2a2a] bg-[#111111] p-2" />

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {activeVideos.map((video, index) => (
                        <div key={video.id} className="space-y-4">
                          <article className="bg-black rounded-2xl overflow-hidden border border-[#2a2a2a] shadow-md h-full">
                            <button
                              onClick={() => openVideoRoom(video.id)}
                              className="block w-full text-left"
                            >
                              <div className="relative">
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  className="w-full h-[200px] sm:h-[220px] lg:h-[240px] object-cover border-b border-[#2a2a2a]"
                                />
                              </div>
                            </button>

                            <div className="p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h2 className="font-semibold text-sm leading-5 truncate text-white">
                                    {video.title}
                                  </h2>
                                  <div className="mt-2 flex flex-col items-start gap-2">
                                    <span className="text-[10px] px-2 py-1 rounded-full bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                                      👁 {video.views.replace(" görüntülenme", "")}
                                    </span>

                                    {isAdmin && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteVideo(video.id);
                                        }}
                                        className="text-[10px] px-2 py-1 rounded-full bg-red-700 text-white border border-red-500"
                                      >
                                        Videoyu Sil
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <p className="text-[11px] text-[#d4af37] shrink-0 self-end text-right">
                                  {formatHours(video.uploadedHoursAgo)}
                                </p>
                              </div>
                            </div>
                          </article>

                          {index % 2 === 1 ? (
                            <div className="rounded-2xl overflow-hidden border border-[#2a2a2a] bg-[#111111] p-2">
                              <BannerAd />
                            </div>
                          ) : (
                            <div className="w-full overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#111111]">
                              <img
                                src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80"
                                alt="Reklam"
                                className="block w-full h-[110px] sm:h-[130px] object-cover"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                          (pageNumber) => (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`w-9 h-9 rounded-full text-sm border ${
                                currentPage === pageNumber
                                  ? "bg-[#d4af37] text-black border-[#d4af37]"
                                  : "bg-[#1a1a1a] text-zinc-300 border-[#2a2a2a]"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                {page === "video" && selectedVideo && (
                  <div className="py-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
                    <div className="space-y-4">
                      <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#2a2a2a] shadow-md">
                        <div className="relative">
                          <video
                            controls
                            poster={selectedVideo.thumbnail}
                            className="w-full h-[220px] sm:h-[340px] lg:h-[520px] object-cover bg-black"
                            onPlay={() => openPlayAdOnce(selectedVideo.id)}
                          >
                            <source src={currentVideoSrc} type="video/mp4" />
                            Tarayıcın video oynatmayı desteklemiyor.
                          </video>

                          <div className="flex items-center gap-2 px-4 py-3 bg-[#111111] border-t border-[#2a2a2a] flex-wrap">
                            <span className="text-xs text-[#d4af37]">Kalite:</span>

                            {(["360p", "720p", "1080p", "1440p"] as const).map((quality) => {
                              const isAvailable = !!selectedVideo.sources[quality];

                              return (
                                <button
                                  key={quality}
                                  onClick={() => isAvailable && setSelectedQuality(quality)}
                                  disabled={!isAvailable}
                                  className={`px-3 py-1 rounded-full text-xs border ${
                                    selectedQuality === quality
                                      ? "bg-[#d4af37] text-black border-[#d4af37]"
                                      : "bg-[#1a1a1a] text-zinc-300 border-[#2a2a2a]"
                                  } ${!isAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
                                >
                                  {quality === "1440p" ? "2K" : quality}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <button
                              onClick={goHome}
                              className="mb-3 text-xs px-3 py-2 rounded-full bg-[#111111] border border-[#2a2a2a] text-[#d4af37]"
                            >
                              ← Ana sayfaya dön
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => deleteVideo(selectedVideo.id)}
                                className="mb-3 text-xs px-3 py-2 rounded-full bg-red-700 text-white border border-red-500"
                              >
                                Videoyu Sil
                              </button>
                            )}
                          </div>

                          <h2 className="text-base sm:text-lg font-semibold text-white">
                            {selectedVideo.title}
                          </h2>

                          <p className="text-xs text-[#d4af37] mt-1">
                            {formatHours(selectedVideo.uploadedHoursAgo)}
                          </p>

                          <p className="text-sm text-zinc-300 mt-3 leading-6">
                            {selectedVideo.description}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl overflow-hidden border border-[#2a2a2a] bg-[#111111] p-2">
                        <BannerAd />
                      </div>

                      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-full">
                            <h3 className="text-sm font-semibold text-[#d4af37]">
                              Canlı mesaj kutusu
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">
                              Herkes giriş yapmadan yazabilir.
                            </p>

                            <div className="mt-3">
                              <input
                                type="text"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder="Misafir adın"
                                className="w-full max-w-[260px] rounded-xl bg-[#111111] border border-[#2a2a2a] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className="flex items-center gap-1 whitespace-nowrap text-[11px] px-1.5 py-0.5 rounded-full bg-[#d4af37]/10 text-[#d4af37]">
                              👁 {viewers} Kişi izliyor
                            </span>
                            <span className="text-[11px] px-2 py-1 rounded-full bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                              Canlı
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                          {selectedVideoMessages.length > 0 ? (
                            selectedVideoMessages.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-xl bg-[#111111] border border-[#2a2a2a] p-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-medium text-white">{item.user}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-[#d4af37]">{item.time}</span>
                                    {isAdmin && selectedVideo && (
                                      <button
                                        onClick={() =>
                                          deleteChatMessage(selectedVideo.id, item.id)
                                        }
                                        className="text-[10px] px-2 py-1 rounded-full bg-red-700 text-white border border-red-500"
                                      >
                                        Sil
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300 mt-2 leading-5">
                                  {item.text}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl bg-[#111111] border border-[#2a2a2a] p-3 text-sm text-zinc-400">
                              Henüz mesaj yok. İlk mesajı sen gönder.
                            </div>
                          )}
                        </div>

                        <form onSubmit={sendChatMessage} className="mt-4 flex gap-2">
                          <input
                            type="text"
                            placeholder="Canlı mesaja yaz..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            className="flex-1 rounded-xl bg-[#111111] border border-[#2a2a2a] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                          />
                          <button className="rounded-xl bg-[#d4af37] text-black px-4 py-3 text-sm font-medium">
                            Gönder
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 h-fit">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <h3 className="text-sm font-semibold text-[#d4af37]">
                            Benzer videolar
                          </h3>
                          {isAdmin && (
                            <button
                              onClick={() => setPage("upload")}
                              className="text-xs px-3 py-2 rounded-full bg-[#d4af37] text-black"
                            >
                              Panel
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                          {relatedVideos.slice(0, 7).map((video) => (
                            <div key={video.id} className="space-y-2">
                              <button
                                onClick={() => openVideoRoom(video.id)}
                                className="w-full text-left"
                              >
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  className="w-full h-40 object-cover rounded-xl"
                                />
                                <p className="text-xs text-zinc-200 mt-2 line-clamp-2">
                                  {video.title}
                                </p>
                              </button>

                              {isAdmin && (
                                <button
                                  onClick={() => deleteVideo(video.id)}
                                  className="text-[10px] px-2 py-1 rounded-full bg-red-700 text-white border border-red-500"
                                >
                                  Videoyu Sil
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="block overflow-hidden rounded-2xl border border-[#2a2a2a]">
                        <img
                          src="https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=900&q=80"
                          alt="Yan reklam"
                          className="w-full h-[300px] object-cover"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {showCategoryMenu && (
          <>
            <div
              className="fixed inset-0 z-[9998] bg-black/50"
              onClick={() => setShowCategoryMenu(false)}
            />

            <div className="fixed top-[78px] left-0 right-0 z-[9999] px-3 sm:px-4">
              <div className="mx-auto w-full max-w-[1400px]">
                <div className="w-full rounded-2xl border border-[#2a2a2a] bg-[#151515] shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto">
                  {categories.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setSelectedCategory(item);
                        setShowCategoryMenu(false);
                      }}
                      className={`block w-full px-4 py-3 text-left text-sm ${
                        selectedCategory === item
                          ? "bg-[#d4af37] text-black"
                          : "text-zinc-200 hover:bg-[#1f1f1f]"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <nav className="fixed bottom-0 left-0 w-full bg-black/95 backdrop-blur border-t border-[#e5e5e5] px-4 py-3 sm:py-4">
          <div className="mx-auto w-full max-w-[1400px]">
            <div className="flex items-center justify-center text-center text-xs gap-4">
              <button
                onClick={goHome}
                className="flex flex-col items-center gap-1 text-[#d4af37]"
              >
                <span className="font-bold">Ana Sayfa</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setPage("upload")}
                  className="flex flex-col items-center gap-1 text-[#d4af37]"
                >
                  <span className="font-bold">Panel</span>
                </button>
              )}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
