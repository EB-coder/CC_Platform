--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: solutions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solutions (
    id integer NOT NULL,
    task_id integer,
    user_id integer,
    code text NOT NULL,
    language character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    score integer,
    feedback text,
    submitted_at timestamp without time zone DEFAULT now(),
    evaluated_at timestamp without time zone
);


ALTER TABLE public.solutions OWNER TO postgres;

--
-- Name: solutions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.solutions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.solutions_id_seq OWNER TO postgres;

--
-- Name: solutions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.solutions_id_seq OWNED BY public.solutions.id;


--
-- Name: task_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_answers (
    id integer NOT NULL,
    task_id integer,
    user_id integer,
    answer_text text,
    file_url character varying(255),
    submitted_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.task_answers OWNER TO postgres;

--
-- Name: task_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_answers_id_seq OWNER TO postgres;

--
-- Name: task_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_answers_id_seq OWNED BY public.task_answers.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    language character varying(50) NOT NULL,
    admin_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    difficulty character varying(20) DEFAULT 'medium'::character varying
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: user_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_notes (
    id integer NOT NULL,
    user_id integer,
    task_id character varying(50) NOT NULL,
    note text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_notes OWNER TO postgres;

--
-- Name: user_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_notes_id_seq OWNER TO postgres;

--
-- Name: user_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_notes_id_seq OWNED BY public.user_notes.id;


--
-- Name: user_solutions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_solutions (
    id integer NOT NULL,
    user_id integer,
    task_id character varying(50) NOT NULL,
    solution text NOT NULL,
    language character varying(20) NOT NULL,
    submission_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_correct boolean
);


ALTER TABLE public.user_solutions OWNER TO postgres;

--
-- Name: user_solutions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_solutions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_solutions_id_seq OWNER TO postgres;

--
-- Name: user_solutions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_solutions_id_seq OWNED BY public.user_solutions.id;


--
-- Name: user_solved_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_solved_tasks (
    user_id integer NOT NULL,
    task_id integer NOT NULL,
    solution_id integer,
    solved_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_solved_tasks OWNER TO postgres;

--
-- Name: user_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_tasks (
    id integer NOT NULL,
    user_id integer,
    task_id character varying(50) NOT NULL,
    is_solved boolean DEFAULT false,
    last_viewed timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_tasks OWNER TO postgres;

--
-- Name: user_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_tasks_id_seq OWNER TO postgres;

--
-- Name: user_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_tasks_id_seq OWNED BY public.user_tasks.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_admin boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: solutions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solutions ALTER COLUMN id SET DEFAULT nextval('public.solutions_id_seq'::regclass);


--
-- Name: task_answers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_answers ALTER COLUMN id SET DEFAULT nextval('public.task_answers_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: user_notes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notes ALTER COLUMN id SET DEFAULT nextval('public.user_notes_id_seq'::regclass);


--
-- Name: user_solutions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_solutions ALTER COLUMN id SET DEFAULT nextval('public.user_solutions_id_seq'::regclass);


--
-- Name: user_tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tasks ALTER COLUMN id SET DEFAULT nextval('public.user_tasks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: solutions solutions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solutions
    ADD CONSTRAINT solutions_pkey PRIMARY KEY (id);


--
-- Name: task_answers task_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_answers
    ADD CONSTRAINT task_answers_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_notes user_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notes
    ADD CONSTRAINT user_notes_pkey PRIMARY KEY (id);


--
-- Name: user_notes user_notes_user_id_task_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notes
    ADD CONSTRAINT user_notes_user_id_task_id_key UNIQUE (user_id, task_id);


--
-- Name: user_solutions user_solutions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_solutions
    ADD CONSTRAINT user_solutions_pkey PRIMARY KEY (id);


--
-- Name: user_solved_tasks user_solved_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_solved_tasks
    ADD CONSTRAINT user_solved_tasks_pkey PRIMARY KEY (user_id, task_id);


--
-- Name: user_tasks user_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tasks
    ADD CONSTRAINT user_tasks_pkey PRIMARY KEY (id);


--
-- Name: user_tasks user_tasks_user_id_task_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tasks
    ADD CONSTRAINT user_tasks_user_id_task_id_key UNIQUE (user_id, task_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_solutions_task; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solutions_task ON public.solutions USING btree (task_id);


--
-- Name: idx_solutions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solutions_user ON public.solutions USING btree (user_id);


--
-- Name: idx_tasks_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_active ON public.tasks USING btree (is_active);


--
-- Name: solutions solutions_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solutions
    ADD CONSTRAINT solutions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: solutions solutions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solutions
    ADD CONSTRAINT solutions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_answers task_answers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_answers
    ADD CONSTRAINT task_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tasks tasks_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: user_notes user_notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notes
    ADD CONSTRAINT user_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_solutions user_solutions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_solutions
    ADD CONSTRAINT user_solutions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_solved_tasks user_solved_tasks_solution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_solved_tasks
    ADD CONSTRAINT user_solved_tasks_solution_id_fkey FOREIGN KEY (solution_id) REFERENCES public.solutions(id);


--
-- Name: user_solved_tasks user_solved_tasks_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_solved_tasks
    ADD CONSTRAINT user_solved_tasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: user_solved_tasks user_solved_tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_solved_tasks
    ADD CONSTRAINT user_solved_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_tasks user_tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tasks
    ADD CONSTRAINT user_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

