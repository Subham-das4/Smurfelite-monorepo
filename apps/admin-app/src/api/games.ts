import type {
  CreateGameRequest,
  GameListResponse,
  GameResponse,
} from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const gamesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGames: builder.query<GameResponse[], void>({
      query: () => "/games",
      transformResponse: (response: GameListResponse) => response.games,
      providesTags: ["Games"],
    }),
    createGame: builder.mutation<GameResponse, CreateGameRequest>({
      query: (body) => ({ url: "/games", method: "POST", body }),
      invalidatesTags: ["Games"],
    }),
    restrictGame: builder.mutation<GameResponse, string>({
      query: (id) => ({
        url: `/games/${id}/restrict`,
        method: "PATCH",
      }),
      invalidatesTags: ["Games"],
    }),
    deleteGame: builder.mutation<void, string>({
      query: (id) => ({ url: `/games/${id}`, method: "DELETE" }),
      invalidatesTags: ["Games"],
    }),
  }),
});

export const {
  useGetGamesQuery,
  useCreateGameMutation,
  useRestrictGameMutation,
  useDeleteGameMutation,
} = gamesApi;
