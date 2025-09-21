-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  date_idea_id integer NOT NULL,
  match_score integer DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT matches_pkey PRIMARY KEY (id),
  CONSTRAINT matches_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name character varying,
  fixed_room_code character varying NOT NULL UNIQUE CHECK (fixed_room_code::text ~ '^[A-Z0-9]{6}$'::text),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.quiz_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  answers jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_responses_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_responses_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT quiz_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_code character varying NOT NULL UNIQUE CHECK (room_code::text ~ '^[A-Z0-9]{6}$'::text),
  creator_id uuid NOT NULL,
  member_id uuid,
  status character varying DEFAULT 'waiting'::character varying CHECK (status::text = ANY (ARRAY['waiting'::character varying, 'active'::character varying, 'completed'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rooms_pkey PRIMARY KEY (id),
  CONSTRAINT rooms_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id),
  CONSTRAINT rooms_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id)
);
CREATE TABLE public.swipes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  date_idea_id integer NOT NULL,
  direction character varying NOT NULL CHECK (direction::text = ANY (ARRAY['left'::character varying, 'right'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT swipes_pkey PRIMARY KEY (id),
  CONSTRAINT swipes_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT swipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  full_name character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);