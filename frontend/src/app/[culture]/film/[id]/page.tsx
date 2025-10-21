"use client";

import { lazy, useEffect, useState, useCallback } from "react";
import axios, { AxiosError } from "axios";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import { Culture } from "@/types/culture";
import { Film, UserFilm } from "@/types/media/film";
import StarRating from "@/components/StarRating";
import ReviewModal from "@/components/ReviewModal";
import Link from "next/link";
import { formatDate } from "@/utils/formatters/formatDate";
import { formatRuntime } from "@/utils/formatters/formatRuntime";
import FilmPosterModal from "@/components/film/FilmPosterModal";
import DateWatchedModal from "@/components/film/FilmDateWatched";
import UserFilmAssignmentForm from "@/components/film/UserFilmAssignmentForm";
import ReactMarkdown from "react-markdown";
import { SVGPath } from "@/utils/path";
import { getLanguageName, getCountryName } from "@/utils/iso";

export default function FilmDetailPage() {
  const { culture, id } = useParams();
  const [currentCulture, setCurrentCulture] = useState<Culture | null>(null);
  const [film, setFilm] = useState<Film | null>(null);
  const [userFilm, setUserFilm] = useState<UserFilm | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDateModal, setShowDateModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"cast" | "crew">("cast");
  const [showFullCast, setShowFullCast] = useState(false);
  const [showFullCrew, setShowFullCrew] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const MAX_CAST_CREW = 20;

  const fetchFilm = useCallback(async () => {
    if (!id) return;

    try {
      const [filmRes, cultureRes] = await Promise.all([
        api.get(`/films/${id}`),
        api.get(`/cultures/?code=${culture}`),
      ]);

      setFilm(filmRes.data);
      setCurrentCulture(cultureRes.data[0]);

      try {
        const userFilmRes = await api.get(`/user-films/by-film/${id}`);

        if (userFilmRes.data && !userFilmRes.data.detail) {
          setUserFilm(userFilmRes.data);
          setRating(userFilmRes.data.rating || 0);
        } else {
          setUserFilm(null);
          setRating(0);
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            console.info(
              "No userFilm entry yet for this film — creating fresh state."
            );
            setUserFilm(null);
            setRating(0);
          } else {
            console.error(
              "Error fetching userFilm:",
              err.response?.data || err.message
            );
          }
        } else {
          console.error("Unexpected error fetching userFilm:", err);
        }
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error(
          "Error fetching film or culture:",
          err.response?.data || err.message
        );
      } else {
        console.error("Unexpected error fetching film or culture:", err);
      }
    }
  }, [id, culture]);

  const ensureUserFilm = async () => {
    if (userFilm) return userFilm;

    try {
      const res = await api.get(`/user-films/by-film/${id}`);
      if (res.data && !res.data.detail) {
        setUserFilm(res.data);
        return res.data;
      }
    } catch (err: unknown) {
      console.warn("Error", err);
    }

    if (!film?.universal_item?.id) {
      console.error("Cannot create UserFilm — missing universal_item id.");
      return null;
    }

    try {
      const createRes = await api.post(`/user-films/`, {
        universal_item_id: film.universal_item.id,
        culture_ids: [currentCulture?.id],
      });
      setUserFilm(createRes.data);
      return createRes.data;
    } catch (err) {
      console.error("Error creating userFilm:", err);
      return null;
    }
  };

  useEffect(() => {
    fetchFilm();
  }, [fetchFilm]);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const updateReview = async (newReview: string) => {
    if (!userFilm?.id) return;

    const uf = await ensureUserFilm();

    const res = await api.patch(`/user-films/${uf.id}/`, {
      notes: newReview,
    });

    setUserFilm(res.data);
  };

  const updateRating = async (newValue: number) => {
    if (!userFilm?.id) return;

    setRating(newValue);

    const uf = await ensureUserFilm();

    const res = await api.patch(`/user-films/${uf.id}/`, {
      rating: newValue,
    });

    setUserFilm(res.data);
  };

  const updateDateWatched = async (date: string | null) => {
    if (!userFilm?.id) return;

    const uf = await ensureUserFilm();

    setSelectedDate(date || "");
  };

  const toggleSeen = async () => {
    if (!film) return;
    const uf = await ensureUserFilm();

    const res = await api.patch(`/user-films/${uf.id}/`, {
      seen: !uf.seen,
    });

    setUserFilm(res.data);
  };

  const toggleWatchlist = async () => {
    if (!film) return;
    const uf = await ensureUserFilm();

    const res = await api.patch(`/user-films/${uf.id}/`, {
      watchlist: !uf.watchlist,
    });

    setUserFilm(res.data);
  };

  const toggleFavourite = async () => {
    if (!film) return;
    const uf = await ensureUserFilm();

    const res = await api.patch(`/user-films/${uf.id}/`, {
      favourite: !uf.favourite,
    });

    setUserFilm(res.data);
  };

  const handleFilmUpdated = () => {
    window.location.reload();
  };

  const handleAssignmentSuccess = () => {
    setShowAssignmentModal(false);
    fetchFilm(); // Refresh film data to reflect updated cultures/period
  };

  if (!film)
    return <p className="p-4 sm:p-6 font-sans text-gray-400">Loading...</p>;

  return (
    <div className="min-h-screen flex flex-col p-2 sm:p-6">
      {(userFilm?.background_pic || film?.background_pic) && (
        <div className="absolute top-0 left-0 w-full h-[400px] sm:h-[560px] flex justify-center -z-10">
          <div className="relative h-full w-full">
            <img
              src={userFilm?.background_pic || film?.background_pic}
              alt={`${film?.title || "Film"} Backdrop`}
              className="h-full w-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background"></div>
          </div>
        </div>
      )}

      <div className="h-[150px] sm:h-[42vh]"></div>

      <div className="flex flex-col w-full max-w-[900px] sm:max-w-[1150px] items-center justify-center mx-auto">
        <div className="flex flex-col md:flex-row flex-1 gap-4 sm:gap-6 z-10 justify-center w-full">
          <div className="w-full md:w-1/4 space-y-2 flex flex-col items-center">
            {(userFilm?.poster || film?.poster) && (
              <div
                className="relative cursor-pointer group"
                onClick={() => setShowImageModal(true)}
              >
                <img
                  src={userFilm?.poster || film?.poster}
                  alt={`${film?.title || "Film"} Poster`}
                  className="rounded-lg shadow transition-transform duration-200 active:scale-95 w-full max-w-[250px] sm:max-w-[400px]"
                />

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">
                    Change Poster
                  </span>
                </div>
              </div>
            )}
            <div className="w-full flex items-center justify-center text-center space-x-4 sm:space-x-2 mt-2 text-xs sm:text-sm">
              {film.runtime && (
                <p className="text-gray-400">{formatRuntime(film.runtime)}</p>
              )}
              <button
                onClick={toggleFavourite}
                className={`text-base cursor-pointer transition-all duration-300 hover:text-red-500/50 hover:scale-105 active:scale-90 ${
                  userFilm?.favourite ? "text-red-500" : "text-neutral-mid"
                }`}
                title="Favourite"
              >
                ❤︎
              </button>
              <button
                onClick={() => setShowDateModal(true)}
                title="Edit Date Watched"
                className="cursor-pointer"
              >
                <svg
                  viewBox={SVGPath.calendar.viewBox}
                  className={`size-6 fill-current transition hover:scale-105 active:scale-95`}
                >
                  <path d={SVGPath.calendar.path} />
                </svg>
              </button>
              <button
                onClick={() => setShowAssignmentModal(!showAssignmentModal)}
                className="cursor-pointer"
              >
                <svg
                  viewBox={SVGPath.add.viewBox}
                  className={`size-6 fill-current transition hover:scale-105 active:scale-95`}
                >
                  <path d={SVGPath.add.path} />
                </svg>
              </button>

              {showAssignmentModal && (
                <UserFilmAssignmentForm
                  userFilmId={userFilm?.id || 0}
                  initialData={userFilm}
                  currentCultureCode={culture}
                  onSuccess={handleAssignmentSuccess}
                />
              )}

              <DateWatchedModal
                isOpen={showDateModal}
                onClose={() => setShowDateModal(false)}
                onSave={updateDateWatched}
                userFilmId={userFilm?.id || 0}
                initialValue={userFilm?.date_watched || null}
              />
              {showImageModal && film.id && film.tmdb_id && (
                <FilmPosterModal
                  userFilmId={userFilm?.id || 0}
                  tmdbId={parseInt(film.tmdb_id)}
                  onClose={() => setShowImageModal(false)}
                  onUpdated={handleFilmUpdated}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col w-full md:w-3/4 mt-4 md:mt-0">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold font-serif flex items-center">
                {film.title ?? film.title}
              </h1>
              {film.series && (
                <span className="text-gray-400 text-xs sm:text-sm">
                  {film.series} (#{film.volume ?? film.volume})
                </span>
              )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2 text-xs sm:text-md">
                {film.release_date && (
                  <h2>{film.release_date.substring(0, 4)}</h2>
                )}
                {film.alt_title && (
                  <p className="italic text-gray-400 font-light">{`'${film.alt_title}'`}</p>
                )}
                {film.creator_string && (
                  <div className="text-gray-400 font-light">
                    DIRECTED BY
                    <Link
                      href={`/${culture}/film/search/director/${encodeURIComponent(
                        film.creator_string
                      )}`}
                      className="cursor-pointer text-foreground text-base transition-all duration-500 hover:text-primary ml-1"
                    >
                      {film.creator_string}{" "}
                      {film.alt_creator_name ? (
                        <span className="text-gray-400 ml-1 italic text-xs transition-all duration-500 hover:text-primary">
                          {film.alt_creator_name}
                        </span>
                      ) : (
                        ""
                      )}
                    </Link>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-2 w-full mt-4">
              <div className="w-full md:w-3/5 space-y-4">
                {film.blurb && (
                  <h6 className="text-sm font-source font-light text-gray-400">
                    {film.blurb.toUpperCase()}
                  </h6>
                )}

                {film.synopsis && (
                  <div className="text-md font-inter text-gray-400 leading-relaxed">
                    <ReactMarkdown>{film.synopsis}</ReactMarkdown>
                  </div>
                )}

                <div className="rounded-lg block md:hidden w-full md:w-2/5 h-fit mt-4 md:mt-0">
                  <div className="w-full text-center border-y-foreground/20 border-y-1 pt-3 flex sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="w-full sm:w-1/2 flex flex-col items-center">
                      <button
                        onClick={toggleSeen}
                        aria-label="Toggle Seen"
                        className="cursor-pointer mb-2"
                      >
                        <svg
                          viewBox={SVGPath.eye.viewBox}
                          className={`size-6 fill-current transition hover:scale-105 active:scale-95 hover:fill-green-300 ${
                            userFilm?.seen ? "fill-green-300" : ""
                          }`}
                        >
                          <path d={SVGPath.eye.path} />
                        </svg>
                      </button>
                      {userFilm?.seen ? (
                        <h2 className="text-xs sm:text-md text-green-300">
                          Seen
                        </h2>
                      ) : (
                        <h2 className="text-xs sm:text-md text-gray-400">
                          Not Seen
                        </h2>
                      )}
                    </div>

                    <div className="w-full sm:w-1/2 flex flex-col items-center">
                      <button
                        onClick={toggleWatchlist}
                        aria-label="Toggle Watchlist"
                        className="cursor-pointer mb-2"
                      >
                        <svg
                          viewBox={SVGPath.clock.viewBox}
                          className={`size-6 transition hover:scale-105 active:scale-95 hover:fill-blue-300 ${
                            userFilm?.watchlist
                              ? "fill-blue-300"
                              : "fill-current"
                          }`}
                        >
                          <path d={SVGPath.clock.path} />
                        </svg>
                      </button>
                      {userFilm?.watchlist ? (
                        <h2 className="text-xs sm:text-md text-blue-300">
                          Watchlist
                        </h2>
                      ) : (
                        <h2 className="text-xs sm:text-md text-gray-400">
                          Watchlist
                        </h2>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center border-b-foreground/20 border-b-1 p-4">
                    <h2 className="text-xs text-gray-400 font-light">
                      {userFilm?.rating ? "RATED" : "UNRATED"}
                    </h2>
                    {isSmallScreen ? (
                      <StarRating value={rating || 0} onChange={updateRating} />
                    ) : (
                      ""
                    )}
                  </div>

                  {userFilm?.notes ? (
                    <div className="flex flex-col w-full py-4 px-2">
                      <div className="flex space-x-2 items-center text-center">
                        <h3 className="font-semibold text-gray-400">Review</h3>
                        <button
                          onClick={() => setShowReviewModal(true)}
                          className="text-md cursor-pointer transition-all duration-300 hover:text-primary hover:scale-105 active:scale-90"
                        >
                          ✎
                        </button>
                      </div>
                      <p className="text-sm text-left">{userFilm?.notes}</p>
                    </div>
                  ) : (
                    <div className="py-4 px-2 text-center">
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="bg-primary text-white px-4 py-2 rounded hover:scale-105 transition cursor-pointer active:scale-95"
                      >
                        + Add Review
                      </button>
                    </div>
                  )}

                  <ReviewModal
                    isOpen={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    onSave={updateReview}
                    initialValue={userFilm?.notes || ""}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setActiveTab("cast")}
                      className={`font-sans font-semibold cursor-pointer text-sm sm:text-base ${
                        activeTab === "cast"
                          ? "text-primary border-b-2 border-primary"
                          : "text-gray-500"
                      }`}
                    >
                      Cast
                    </button>
                    <button
                      onClick={() => setActiveTab("crew")}
                      className={`font-sans font-semibold cursor-pointer text-sm sm:text-base ${
                        activeTab === "crew"
                          ? "text-primary border-b-2 border-primary"
                          : "text-gray-500"
                      }`}
                    >
                      Crew
                    </button>
                  </div>

                  <div className="text-xs sm:text-md">
                    {activeTab === "cast" && (
                      <>
                        <div className="mb-6 relative hidden md:block">
                          <div
                            className={`gap-x-2 gap-y-3 flex flex-wrap transition-all duration-300`}
                          >
                            {(showFullCast
                              ? film.cast
                              : film.cast?.slice(0, MAX_CAST_CREW)
                            )?.map((c, i) => (
                              <div key={i} className="relative group">
                                <Link
                                  className="bg-extra px-2 py-1 w-fit rounded-md text-sm cursor-help transition-all duration-300 hover:bg-extra/50"
                                  href={`/${culture}/film/search/actor/${encodeURIComponent(
                                    c.name
                                  )}`}
                                >
                                  {c.name}
                                </Link>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20 shadow-lg">
                                  {c.role}
                                </div>
                              </div>
                            ))}

                            {film.cast && film.cast.length > MAX_CAST_CREW && (
                              <button
                                onClick={() => setShowFullCast(!showFullCast)}
                                className="bg-extra px-2 py-1 w-fit rounded-md text-sm transition-all duration-300 hover:bg-extra/50 cursor-pointer"
                              >
                                {showFullCast ? "Show Less" : "Show All"}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mb-6 block md:hidden">
                          <div className="grid grid-cols-1">
                            {film.cast?.map((c, i) => (
                              <Link
                                href={`/${culture}/film/search/actor/${encodeURIComponent(
                                  c.name
                                )}`}
                                key={i}
                                className="text-sm mb-2 pb-2 items-center relative group flex justify-between border-b-1 border-b-foreground/20"
                              >
                                <div className="flex flex-col space-y-1">
                                  <div className="">{c.name}</div>
                                  <div className="font-light text-gray-400 font-source">
                                    {c.role}
                                  </div>
                                </div>
                                <div className="font-bold">
                                  <svg
                                    viewBox={SVGPath.arrow.viewBox}
                                    className="size-4 fill-current transition hover:scale-105 active:scale-95 transform rotate-180"
                                  >
                                    <path d={SVGPath.arrow.path} />
                                  </svg>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {activeTab === "crew" && (
                      <>
                        <div className="mb-12 hidden md:block relative">
                          <div
                            className={`space-y-4 flex flex-col transition-all duration-300 ${
                              showFullCrew
                                ? "max-h-none"
                                : "max-h-64 overflow-hidden"
                            }`}
                          >
                            <div className="flex justify-start items-center pr-4 space-x-4">
                              <span className="font-normal text-xs">
                                DIRECTOR
                              </span>
                              <div className="flex flex-wrap gap-2">
                                <Link
                                  className="bg-extra p-1 w-fit rounded-md text-xs transition-all duration-300 hover:bg-extra/50"
                                  href={`/${culture}/film/search/director/${encodeURIComponent(
                                    film.creator_string
                                  )}`}
                                >
                                  {film.creator_string}
                                </Link>
                              </div>
                            </div>
                            {Object.entries(
                              film.crew?.reduce(
                                (acc: Record<string, string[]>, c) => {
                                  if (!acc[c.role]) acc[c.role] = [];
                                  acc[c.role].push(c.name);
                                  return acc;
                                },
                                {}
                              ) || {}
                            ).map(([role, names]) => (
                              <div
                                key={role}
                                className="flex justify-start items-center pr-4 space-x-4"
                              >
                                <span className="font-normal text-xs">
                                  {role.toUpperCase()}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {names.map((name, idx) => (
                                    <Link
                                      href={`/${culture}/film/search/crew/${encodeURIComponent(
                                        name
                                      )}`}
                                      key={idx}
                                      className="bg-extra p-1 w-fit rounded-md text-xs transition-all duration-300 hover:bg-extra/50"
                                    >
                                      {name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          {!showFullCrew &&
                            film.crew &&
                            film.crew.length > MAX_CAST_CREW && (
                              <div className="absolute bottom-4 left-0 w-full h-12 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
                            )}
                          {film.crew && film.crew.length > MAX_CAST_CREW && (
                            <button
                              onClick={() => setShowFullCrew(!showFullCrew)}
                              className="mt-1 cursor-pointer z-10 flex items-center text-xs sm:text-sm"
                            >
                              <span className="mr-1 font-bold transition hover:text-primary">
                                {showFullCrew ? "Show Less" : "Show More"}
                              </span>
                              <span
                                className={`transition-transform duration-300 ${
                                  showFullCrew ? "rotate-180" : "rotate-0"
                                }`}
                              >
                                <svg
                                  viewBox={SVGPath.chevron.viewBox}
                                  className="size-5 fill-current transition hover:scale-105 active:scale-95"
                                >
                                  <path d={SVGPath.chevron.path} />
                                </svg>
                              </span>
                            </button>
                          )}
                        </div>
                        <div className="mb-12 block md:hidden">
                          <div className="grid grid-cols-1">
                            {film.crew?.map((c, i) => (
                              <Link
                                href={`/${culture}/film/search/crew/${encodeURIComponent(
                                  c.name
                                )}`}
                                key={i}
                                className="mb-2 text-sm pb-2 items-center relative group flex justify-between border-b-1 border-b-foreground/20"
                              >
                                <div className="flex flex-col space-y-1">
                                  <div className="">{c.name}</div>
                                  <div className="font-light text-gray-400 font-source">
                                    {c.role}
                                  </div>
                                </div>
                                <div className="font-bold">
                                  <svg
                                    viewBox={SVGPath.arrow.viewBox}
                                    className="size-4 fill-current transition hover:scale-105 active:scale-95 transform rotate-180"
                                  >
                                    <path d={SVGPath.arrow.path} />
                                  </svg>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="mt-3 text-xs sm:text-base text-primary cursor-pointer hover:text-neutral-mid"
                >
                  {showDetails ? "Hide Details" : "More Details"}
                </button>
                {showDetails && (
                  <div className="mt-4 text-left w-full space-y-2 text-xs sm:text-sm text-neutral-mid">
                    {film.genre && (
                      <div className="flex items-center space-x-2">
                        <span>
                          <strong>Genres:</strong>{" "}
                        </span>
                        {film.genre?.map((g, i) => (
                          <Link
                            href={`/${culture}/film/search/genre/${encodeURIComponent(
                              g
                            )}`}
                            className="bg-extra p-1 rounded-md transition-all duration-300 hover:bg-primary/50"
                            key={i}
                          >
                            {g}
                          </Link>
                        ))}
                      </div>
                    )}
                    {film.tags && film.tags.length > 1 && (
                      <div className="flex items-center space-x-2">
                        <span>
                          <strong>Tags:</strong>{" "}
                        </span>
                        {film.tags?.map((g, i) => (
                          <div className="bg-extra p-1 rounded-md" key={i}>
                            {g}
                          </div>
                        ))}
                      </div>
                    )}
                    {film.series && (
                      <p>
                        <strong>Series:</strong> {film.series}
                      </p>
                    )}
                    {film.volume && (
                      <p>
                        <strong>Entry #:</strong> {film.volume}
                      </p>
                    )}
                    {userFilm?.rating && (
                      <p>
                        <strong>Rating:</strong>{" "}
                        {Number(userFilm?.rating).toFixed(0)} / 10
                      </p>
                    )}
                    {film.runtime && (
                      <p>
                        <strong>Runtime:</strong> {formatRuntime(film.runtime)}
                      </p>
                    )}
                    {userFilm?.date_watched && (
                      <p>
                        <strong>Date Watched:</strong>{" "}
                        {formatDate(userFilm?.date_watched)}
                      </p>
                    )}
                    {film.release_date && (
                      <p>
                        <strong>Release Date:</strong>{" "}
                        {formatDate(film.release_date)}
                      </p>
                    )}
                    {film.festival && (
                      <p>
                        <strong>Premiered at:</strong> {film.festival}
                      </p>
                    )}
                    {film.budget && (
                      <p>
                        <strong>Budget:</strong>{" "}
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                        }).format(Number(film.budget))}
                      </p>
                    )}
                    {film.box_office && (
                      <p>
                        <strong>Box Office:</strong>{" "}
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                        }).format(Number(film.box_office))}
                      </p>
                    )}
                    {film.languages && (
                      <p>
                        <strong>Languages:</strong> {film.languages?.map(lang => getLanguageName(lang)).join(", ")}
                      </p>
                    )}
                    {film.countries && (
                      <p>
                        <strong>Countries:</strong> {film.countries?.map(code => getCountryName(code)).join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-lg hidden md:block w-full md:w-2/5 bg-extra h-fit mt-4 md:mt-0">
                <div className="w-full text-center border-b-background border-b-2 p-4 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="w-full sm:w-1/2 flex flex-col items-center">
                    <button
                      onClick={toggleSeen}
                      aria-label="Toggle Seen"
                      className="cursor-pointer mb-2"
                    >
                      <svg
                        viewBox={SVGPath.eye.viewBox}
                        className={`size-6 fill-current transition hover:scale-105 active:scale-95 hover:fill-green-300 ${
                          userFilm?.seen ? "fill-green-300" : ""
                        }`}
                      >
                        <path d={SVGPath.eye.path} />
                      </svg>
                    </button>
                    {userFilm?.seen ? (
                      <h2 className="text-xs sm:text-md text-green-300">
                        Seen
                      </h2>
                    ) : (
                      <h2 className="text-xs sm:text-md text-gray-400">
                        Not Seen
                      </h2>
                    )}
                  </div>

                  <div className="w-full sm:w-1/2 flex flex-col items-center">
                    <button
                      onClick={toggleWatchlist}
                      aria-label="Toggle Watchlist"
                      className="cursor-pointer mb-2"
                    >
                      <svg
                        viewBox={SVGPath.clock.viewBox}
                        className={`size-6 transition hover:scale-105 active:scale-95 hover:fill-blue-300 ${
                          userFilm?.watchlist ? "fill-blue-300" : "fill-current"
                        }`}
                      >
                        <path d={SVGPath.clock.path} />
                      </svg>
                    </button>
                    {userFilm?.watchlist ? (
                      <h2 className="text-xs sm:text-md text-blue-300">
                        Watchlist
                      </h2>
                    ) : (
                      <h2 className="text-xs sm:text-md text-gray-400">
                        Watchlist
                      </h2>
                    )}
                  </div>
                </div>

                <div className="flex flex-col font-source items-center border-b-background border-b-2 p-4">
                  <h2 className="text-xs text-gray-400 font-light">
                    {userFilm?.rating ? "RATED" : "UNRATED"}
                  </h2>
                  {!isSmallScreen ? (
                    <StarRating value={rating || 0} onChange={updateRating} />
                  ) : (
                    ""
                  )}
                </div>

                {userFilm?.notes ? (
                  <div className="flex flex-col justify-start py-4 px-2">
                    <div className="flex space-x-2 items-center">
                      <h3 className="font-semibold">Review</h3>
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="text-md cursor-pointer transition-all duration-300 hover:text-primary hover:scale-105 active:scale-90"
                      >
                        ✎
                      </button>
                    </div>
                    <p className="text-sm">{userFilm?.notes}</p>
                  </div>
                ) : (
                  <div className="py-4 px-2 text-center">
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="bg-primary text-white px-4 py-2 rounded hover:scale-105 transition cursor-pointer active:scale-95"
                    >
                      + Add Review
                    </button>
                  </div>
                )}

                <ReviewModal
                  isOpen={showReviewModal}
                  onClose={() => setShowReviewModal(false)}
                  onSave={updateReview}
                  initialValue={userFilm?.notes || ""}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
