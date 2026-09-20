--
-- PostgreSQL database dump
--

\restrict oiSPeVOVkwgYBKrhiKI15h8abhUmWZajB5V8SordNPThSGeT7BI1zMzDW4qcoyy

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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
-- Name: college_fees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.college_fees (
    id bigint NOT NULL,
    college_id text NOT NULL,
    tuition_fee numeric(12,2),
    hostel_fee numeric(12,2),
    other_fee numeric(12,2),
    total_annual_fee numeric(12,2),
    academic_year integer,
    source_label character varying(255),
    source_url text,
    verification_status character varying(50) DEFAULT 'pending'::character varying,
    retrieved_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: college_fees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.college_fees_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: college_fees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.college_fees_id_seq OWNED BY public.college_fees.id;


--
-- Name: college_review_sentiment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.college_review_sentiment (
    id bigint NOT NULL,
    review_id bigint NOT NULL,
    overall_sentiment character varying(20),
    overall_score numeric(6,4),
    academics_score numeric(6,4),
    placements_score numeric(6,4),
    faculty_score numeric(6,4),
    infrastructure_score numeric(6,4),
    hostel_score numeric(6,4),
    campus_life_score numeric(6,4),
    value_for_money_score numeric(6,4),
    model_name character varying(255),
    confidence numeric(6,4),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: college_review_sentiment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.college_review_sentiment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: college_review_sentiment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.college_review_sentiment_id_seq OWNED BY public.college_review_sentiment.id;


--
-- Name: college_review_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.college_review_sources (
    id bigint NOT NULL,
    college_id character varying(255) NOT NULL,
    source character varying(30) NOT NULL,
    external_place_id character varying(255),
    source_url text,
    rating numeric(4,2),
    review_count integer,
    source_status character varying(50) DEFAULT 'ACTIVE'::character varying NOT NULL,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: college_review_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.college_review_sources_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: college_review_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.college_review_sources_id_seq OWNED BY public.college_review_sources.id;


--
-- Name: college_review_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.college_review_stats (
    id bigint NOT NULL,
    college_id text NOT NULL,
    source text NOT NULL,
    external_place_id text,
    source_display_name text,
    source_address text,
    rating numeric(3,2),
    review_count integer,
    bayesian_rating numeric(5,3),
    review_score numeric(6,2),
    match_confidence numeric(5,4),
    source_url text,
    raw_metadata jsonb,
    last_synced_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: college_review_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.college_review_stats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: college_review_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.college_review_stats_id_seq OWNED BY public.college_review_stats.id;


--
-- Name: college_sentiment_summary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.college_sentiment_summary (
    college_id character varying(255) NOT NULL,
    overall_score numeric(5,2),
    placement_score numeric(5,2),
    academics_score numeric(5,2),
    faculty_score numeric(5,2),
    campus_score numeric(5,2),
    hostel_score numeric(5,2),
    infrastructure_score numeric(5,2),
    fees_score numeric(5,2),
    review_count integer DEFAULT 0,
    confidence_score numeric(5,2),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    google_rating numeric(4,2),
    google_review_count integer,
    google_sentiment numeric(6,2),
    reddit_sentiment numeric(6,2),
    quora_sentiment numeric(6,2),
    placement_sentiment numeric(6,2),
    faculty_sentiment numeric(6,2),
    campus_sentiment numeric(6,2),
    hostel_sentiment numeric(6,2),
    infrastructure_sentiment numeric(6,2),
    fee_roi_sentiment numeric(6,2),
    overall_sentiment numeric(6,2),
    review_score numeric(6,2),
    analyzed_reviews integer DEFAULT 0
);


--
-- Name: cw_rec_uptac_cutoffs_2025; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cw_rec_uptac_cutoffs_2025 (
    id bigint NOT NULL,
    college_id text NOT NULL,
    branch_id bigint NOT NULL,
    year integer NOT NULL,
    round text NOT NULL,
    category text NOT NULL,
    quota text,
    gender text,
    opening_rank integer,
    closing_rank integer NOT NULL,
    official_college_name text NOT NULL,
    official_branch_name text NOT NULL,
    source_label text NOT NULL,
    source_url text,
    is_verified boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    verification_status text DEFAULT 'VERIFIED'::text NOT NULL,
    retrieved_at timestamp with time zone DEFAULT now() NOT NULL,
    counselling_type text DEFAULT 'UPTAC'::text NOT NULL
);


--
-- Name: cw_rec_uptac_cutoffs_2025_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cw_rec_uptac_cutoffs_2025_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cw_rec_uptac_cutoffs_2025_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cw_rec_uptac_cutoffs_2025_id_seq OWNED BY public.cw_rec_uptac_cutoffs_2025.id;


--
-- Name: fee_source_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fee_source_records (
    id bigint NOT NULL,
    college_id text,
    college_name text NOT NULL,
    program text,
    branch_id bigint,
    academic_year integer NOT NULL,
    fee_scope text DEFAULT 'college_program'::text NOT NULL,
    tuition_fee_per_semester numeric(12,2),
    academic_fee_per_semester numeric(12,2),
    hostel_fee_per_semester numeric(12,2),
    mess_fee_per_semester numeric(12,2),
    first_semester_fee numeric(12,2),
    first_year_fee numeric(12,2),
    annual_academic_fee numeric(12,2),
    annual_total_fee numeric(12,2),
    total_course_fee numeric(12,2),
    one_time_fee numeric(12,2),
    security_deposit numeric(12,2),
    source_kind character varying(30) NOT NULL,
    source_label character varying(255),
    source_url text NOT NULL,
    source_priority integer DEFAULT 50 NOT NULL,
    confidence_score integer DEFAULT 50 NOT NULL,
    verification_status character varying(30) DEFAULT 'pending_review'::character varying NOT NULL,
    extraction_method character varying(30) DEFAULT 'manual'::character varying,
    notes text,
    retrieved_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fee_source_confidence_check CHECK (((confidence_score >= 0) AND (confidence_score <= 100))),
    CONSTRAINT fee_source_kind_check CHECK (((source_kind)::text = ANY ((ARRAY['official'::character varying, 'counselling_portal'::character varying, 'collegedunia'::character varying, 'shiksha'::character varying, 'careers360'::character varying, 'other_secondary'::character varying])::text[]))),
    CONSTRAINT fee_source_priority_check CHECK (((source_priority >= 0) AND (source_priority <= 100))),
    CONSTRAINT fee_source_status_check CHECK (((verification_status)::text = ANY ((ARRAY['pending_review'::character varying, 'review_recommended'::character varying, 'high_confidence'::character varying, 'verified'::character varying, 'rejected'::character varying, 'stale'::character varying])::text[])))
);


--
-- Name: fee_source_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fee_source_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fee_source_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fee_source_records_id_seq OWNED BY public.fee_source_records.id;


--
-- Name: fee_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fee_variants (
    id bigint NOT NULL,
    branch_fee_id bigint NOT NULL,
    semester integer,
    fee_period character varying(20),
    student_category character varying(100),
    income_min numeric(12,2),
    income_max numeric(12,2),
    residence_type character varying(30),
    room_type character varying(30),
    tuition_fee numeric(12,2),
    admission_fee numeric(12,2),
    institute_fee numeric(12,2),
    hostel_fee numeric(12,2),
    mess_fee numeric(12,2),
    caution_deposit numeric(12,2),
    other_fee numeric(12,2),
    total_fee numeric(12,2),
    is_one_time_included boolean DEFAULT false,
    verification_status character varying(30) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fee_variants_amounts_nonnegative_check CHECK ((((tuition_fee IS NULL) OR (tuition_fee >= (0)::numeric)) AND ((admission_fee IS NULL) OR (admission_fee >= (0)::numeric)) AND ((institute_fee IS NULL) OR (institute_fee >= (0)::numeric)) AND ((hostel_fee IS NULL) OR (hostel_fee >= (0)::numeric)) AND ((mess_fee IS NULL) OR (mess_fee >= (0)::numeric)) AND ((caution_deposit IS NULL) OR (caution_deposit >= (0)::numeric)) AND ((other_fee IS NULL) OR (other_fee >= (0)::numeric)) AND ((total_fee IS NULL) OR (total_fee >= (0)::numeric)))),
    CONSTRAINT fee_variants_fee_period_check CHECK (((fee_period IS NULL) OR ((fee_period)::text = ANY ((ARRAY['semester'::character varying, 'annual'::character varying])::text[])))),
    CONSTRAINT fee_variants_income_check CHECK (((income_min IS NULL) OR (income_max IS NULL) OR (income_min <= income_max))),
    CONSTRAINT fee_variants_residence_type_check CHECK (((residence_type IS NULL) OR ((residence_type)::text = ANY ((ARRAY['day_scholar'::character varying, 'hosteller'::character varying])::text[])))),
    CONSTRAINT fee_variants_room_type_check CHECK (((room_type IS NULL) OR ((room_type)::text = ANY ((ARRAY['AC'::character varying, 'non_AC'::character varying, 'double_sharing'::character varying, 'single_occupancy'::character varying, 'triple_sharing'::character varying])::text[])))),
    CONSTRAINT fee_variants_semester_check CHECK (((semester IS NULL) OR ((semester >= 1) AND (semester <= 12))))
);


--
-- Name: fee_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fee_variants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fee_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fee_variants_id_seq OWNED BY public.fee_variants.id;


--
-- Name: review_platform_aspect_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_platform_aspect_ratings (
    id bigint NOT NULL,
    college_id text NOT NULL,
    source_id bigint,
    aspect text NOT NULL,
    rating numeric(8,2),
    rating_scale numeric(8,2),
    programme_scope text,
    source_url text,
    observed_at timestamp with time zone,
    raw_payload jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: review_platform_aspect_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_platform_aspect_ratings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_platform_aspect_ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_platform_aspect_ratings_id_seq OWNED BY public.review_platform_aspect_ratings.id;


--
-- Name: sentiment_aspects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sentiment_aspects (
    id bigint NOT NULL,
    review_id bigint NOT NULL,
    aspect character varying(50) NOT NULL,
    sentiment character varying(20) NOT NULL,
    score numeric(5,4),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sentiment_aspects_sentiment_check CHECK (((sentiment)::text = ANY ((ARRAY['positive'::character varying, 'neutral'::character varying, 'negative'::character varying, 'mixed'::character varying])::text[])))
);


--
-- Name: sentiment_aspects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sentiment_aspects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sentiment_aspects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sentiment_aspects_id_seq OWNED BY public.sentiment_aspects.id;


--
-- Name: sentiment_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sentiment_reviews (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    source character varying(50) NOT NULL,
    source_url text,
    review_text text NOT NULL,
    language character varying(20),
    overall_sentiment character varying(20),
    sentiment_score numeric(5,4),
    review_date timestamp without time zone,
    analyzed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sentiment_reviews_sentiment_check CHECK (((overall_sentiment IS NULL) OR ((overall_sentiment)::text = ANY ((ARRAY['positive'::character varying, 'neutral'::character varying, 'negative'::character varying, 'mixed'::character varying])::text[]))))
);


--
-- Name: sentiment_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sentiment_reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sentiment_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sentiment_reviews_id_seq OWNED BY public.sentiment_reviews.id;


--
-- Name: college_fees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.college_fees ALTER COLUMN id SET DEFAULT nextval('public.college_fees_id_seq'::regclass);


--
-- Name: college_review_sentiment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.college_review_sentiment ALTER COLUMN id SET DEFAULT nextval('public.college_review_sentiment_id_seq'::regclass);


--
-- Name: college_review_sources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.college_review_sources ALTER COLUMN id SET DEFAULT nextval('public.college_review_sources_id_seq'::regclass);


--
-- Name: college_review_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.college_review_stats ALTER COLUMN id SET DEFAULT nextval('public.college_review_stats_id_seq'::regclass);


--
-- Name: cw_rec_uptac_cutoffs_2025 id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cw_rec_uptac_cutoffs_2025 ALTER COLUMN id SET DEFAULT nextval('public.cw_rec_uptac_cutoffs_2025_id_seq'::regclass);


--
-- Name: fee_source_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_source_records ALTER COLUMN id SET DEFAULT nextval('public.fee_source_records_id_seq'::regclass);


--
-- Name: fee_variants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_variants ALTER COLUMN id SET DEFAULT nextval('public.fee_variants_id_seq'::regclass);


--
-- Name: review_platform_aspect_ratings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_platform_aspect_ratings ALTER COLUMN id SET DEFAULT nextval('public.review_platform_aspect_ratings_id_seq'::regclass);


--
-- Name: sentiment_aspects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sentiment_aspects ALTER COLUMN id SET DEFAULT nextval('public.sentiment_aspects_id_seq'::regclass);


--
-- Name: sentiment_reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sentiment_reviews ALTER COLUMN id SET DEFAULT nextval('public.sentiment_reviews_id_seq'::regclass);


--
-- Name: college_fees college_fees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.college_fees
    ADD CONSTRAINT college_fees_pkey PRIMARY KEY (id);


--
-- Name: college_review_sentiment college_review_sentiment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.college_review_sentiment
    ADD CONSTRAINT college_review_sentiment_pkey PRIMARY KEY (id);


--
-- Name: college_review_sources college_review_sources_college_id_source_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.college_review_sources
    ADD CONSTRAINT college_review_sources_college_id_source_key UNIQUE (college_id, source);


--
-- Name: college_review_sources college_review_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.college_review_sources
    ADD CONSTRAINT college_review_sources_pkey PRIMARY KEY (id);


--
-- Name: college_review_stats college_review_stats_college_id_source_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.college_review_stats
    ADD CONSTRAINT college_review_stats_college_id_source_key UNIQUE (college_id, source);


--
-- Name: college_review_stats college_review_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.college_review_stats
    ADD CONSTRAINT college_review_stats_pkey PRIMARY KEY (id);


--
-- Name: college_sentiment_summary college_sentiment_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.college_sentiment_summary
    ADD CONSTRAINT college_sentiment_summary_pkey PRIMARY KEY (college_id);


--
-- Name: cw_rec_uptac_cutoffs_2025 cw_rec_uptac_cutoffs_2025_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cw_rec_uptac_cutoffs_2025
    ADD CONSTRAINT cw_rec_uptac_cutoffs_2025_pkey PRIMARY KEY (id);


--
-- Name: fee_source_records fee_source_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_source_records
    ADD CONSTRAINT fee_source_records_pkey PRIMARY KEY (id);


--
-- Name: fee_variants fee_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_variants
    ADD CONSTRAINT fee_variants_pkey PRIMARY KEY (id);


--
-- Name: review_platform_aspect_ratings review_platform_aspect_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_platform_aspect_ratings
    ADD CONSTRAINT review_platform_aspect_ratings_pkey PRIMARY KEY (id);


--
-- Name: sentiment_aspects sentiment_aspects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sentiment_aspects
    ADD CONSTRAINT sentiment_aspects_pkey PRIMARY KEY (id);


--
-- Name: sentiment_reviews sentiment_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sentiment_reviews
    ADD CONSTRAINT sentiment_reviews_pkey PRIMARY KEY (id);


--
-- Name: fee_source_unique_source_record; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX fee_source_unique_source_record ON public.fee_source_records USING btree (COALESCE(college_id, ''::text), academic_year, source_url);


--
-- Name: idx_college_review_stats_college; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_college_review_stats_college ON public.college_review_stats USING btree (college_id);


--
-- Name: idx_college_review_stats_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_college_review_stats_source ON public.college_review_stats USING btree (source);


--
-- Name: idx_cw_rec_uptac_2025_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cw_rec_uptac_2025_branch ON public.cw_rec_uptac_cutoffs_2025 USING btree (branch_id);


--
-- Name: idx_cw_rec_uptac_2025_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cw_rec_uptac_2025_lookup ON public.cw_rec_uptac_cutoffs_2025 USING btree (year, round, category, quota, gender, closing_rank);


--
-- Name: idx_fee_source_records_college; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_source_records_college ON public.fee_source_records USING btree (college_id);


--
-- Name: idx_fee_source_records_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_source_records_status ON public.fee_source_records USING btree (verification_status, confidence_score DESC);


--
-- Name: idx_fee_source_records_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_source_records_year ON public.fee_source_records USING btree (academic_year);


--
-- Name: idx_fee_variants_branch_fee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_variants_branch_fee ON public.fee_variants USING btree (branch_fee_id);


--
-- Name: idx_fee_variants_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_variants_category ON public.fee_variants USING btree (student_category);


--
-- Name: idx_fee_variants_residence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_variants_residence ON public.fee_variants USING btree (residence_type);


--
-- Name: idx_fee_variants_semester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_variants_semester ON public.fee_variants USING btree (semester);


--
-- Name: idx_fees_college; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fees_college ON public.college_fees USING btree (college_id);


--
-- Name: idx_fees_college_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fees_college_year ON public.college_fees USING btree (college_id, academic_year);


--
-- Name: idx_review_platform_aspect_college; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_platform_aspect_college ON public.review_platform_aspect_ratings USING btree (college_id);


--
-- Name: idx_review_sources_college; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_sources_college ON public.college_review_sources USING btree (college_id);


--
-- Name: idx_review_sources_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_sources_source ON public.college_review_sources USING btree (source);


--
-- Name: idx_sentiment_aspects_aspect; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sentiment_aspects_aspect ON public.sentiment_aspects USING btree (aspect);


--
-- Name: idx_sentiment_aspects_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sentiment_aspects_review ON public.sentiment_aspects USING btree (review_id);


--
-- Name: idx_sentiment_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sentiment_review ON public.college_review_sentiment USING btree (review_id);


--
-- Name: idx_sentiment_reviews_college; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sentiment_reviews_college ON public.sentiment_reviews USING btree (college_id);


--
-- Name: idx_sentiment_reviews_sentiment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sentiment_reviews_sentiment ON public.sentiment_reviews USING btree (overall_sentiment);


--
-- Name: idx_sentiment_reviews_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sentiment_reviews_source ON public.sentiment_reviews USING btree (source);


--
-- Name: idx_sentiment_reviews_source_url; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_sentiment_reviews_source_url ON public.sentiment_reviews USING btree (source, source_url) WHERE (source_url IS NOT NULL);


--
-- Name: uq_review_source_college_source; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_review_source_college_source ON public.college_review_sources USING btree (college_id, source) WHERE ((college_id IS NOT NULL) AND (source IS NOT NULL));


--
-- Name: college_review_stats college_review_stats_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.college_review_stats
    ADD CONSTRAINT college_review_stats_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id) ON DELETE CASCADE;


--
-- Name: fee_variants fee_variants_branch_fee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_variants
    ADD CONSTRAINT fee_variants_branch_fee_id_fkey FOREIGN KEY (branch_fee_id) REFERENCES public.branch_fees(id) ON DELETE CASCADE;


--
-- Name: review_platform_aspect_ratings review_platform_aspect_ratings_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_platform_aspect_ratings
    ADD CONSTRAINT review_platform_aspect_ratings_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id) ON DELETE CASCADE;


--
-- Name: review_platform_aspect_ratings review_platform_aspect_ratings_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_platform_aspect_ratings
    ADD CONSTRAINT review_platform_aspect_ratings_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.review_sources(id) ON DELETE SET NULL;


--
-- Name: sentiment_aspects sentiment_aspects_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sentiment_aspects
    ADD CONSTRAINT sentiment_aspects_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.sentiment_reviews(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict oiSPeVOVkwgYBKrhiKI15h8abhUmWZajB5V8SordNPThSGeT7BI1zMzDW4qcoyy

