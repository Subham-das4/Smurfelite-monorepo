import type { GameListResponse, GameResponse } from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const gamesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGames: builder.query<GameResponse[], void>({
      query: () => "/games",
      transformResponse: (response: GameListResponse) => response.games,
      providesTags: ["Games"],
    }),
  }),
});

export const { useGetGamesQuery } = gamesApi;
