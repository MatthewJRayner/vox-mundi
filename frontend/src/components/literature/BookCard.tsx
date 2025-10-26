"use client";

import Link from "next/link";
import { Book, UserBook } from "@/types/media/book";
import { useParams } from "next/navigation";

type BookProps = {
    book: Book & { userbook?: UserBook | null }
}

export default function BookCard({ book }: BookProps) {
    const { culture } = useParams();
    const userBook = book.userbook ?? null

    return (
        <Link href={`/${culture}/literature/${book.id}`}>
            <div className="relative group w-full aspect-[2/3] rounded overflow-hidden shadow cursor-pointer h-fit">
                {userBook?.cover ? (
                    <img 
                        src={userBook.cover}
                        alt={book.title}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105`}
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                    />
                ) : book.cover ? (
                    <img 
                        src={book.cover}
                        alt={book.title}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105`}
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                    />
                ) : (
                    <div className="w-full h-full bg-extra flex items-center justify-center">
                        No Poster
                    </div>
                )}

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
                    <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
                    <div className="absolute p-2 inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-70 transition-opacity duration-300 flex flex-col items-center justify-center text-center">
                        <h3 className="text-white text-lg font-semibold">{book.title}</h3>
                        {book.creator_string && (
                            <p className="text-white/50 text-sm">{book.creator_string}</p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}