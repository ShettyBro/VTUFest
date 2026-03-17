--
-- PostgreSQL database dump
--

\restrict dfMiu8iZi2RD6sJkHsuuUFWUdSrrFgiIkfE0ysShnQfoJ7lcLtsVAVKobZNutXe

-- Dumped from database version 17.8 (6108b59)
-- Dumped by pg_dump version 18.3

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

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accommodation_allotments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.accommodation_allotments (
    id bigint NOT NULL,
    request_id bigint NOT NULL,
    college_id bigint NOT NULL,
    accommodation_name character varying(255) NOT NULL,
    accommodation_type character varying(100),
    address text,
    location_url text,
    contact_name character varying(255),
    contact_phone character varying(20),
    notes text,
    allotted_boys integer DEFAULT 0 NOT NULL,
    allotted_girls integer DEFAULT 0 NOT NULL,
    allotted_by bigint,
    allotted_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.accommodation_allotments OWNER TO neondb_owner;

--
-- Name: accommodation_allotments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.accommodation_allotments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accommodation_allotments_id_seq OWNER TO neondb_owner;

--
-- Name: accommodation_allotments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.accommodation_allotments_id_seq OWNED BY public.accommodation_allotments.id;


--
-- Name: accommodation_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.accommodation_requests (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    total_boys integer DEFAULT 0 NOT NULL,
    total_girls integer DEFAULT 0 NOT NULL,
    contact_person_name character varying(255) NOT NULL,
    contact_person_phone character varying(20) NOT NULL,
    special_requirements text,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    applied_by_user_id bigint,
    applied_by_role character varying(50),
    applied_by_type character varying(50),
    admin_remarks text,
    applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp without time zone
);


ALTER TABLE public.accommodation_requests OWNER TO neondb_owner;

--
-- Name: accommodation_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.accommodation_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accommodation_requests_id_seq OWNER TO neondb_owner;

--
-- Name: accommodation_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.accommodation_requests_id_seq OWNED BY public.accommodation_requests.id;


--
-- Name: accompanist_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.accompanist_sessions (
    session_id character varying(100) NOT NULL,
    college_id bigint NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(255),
    accompanist_type character varying(20) NOT NULL,
    student_id bigint,
    assigned_events jsonb,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id integer
);


ALTER TABLE public.accompanist_sessions OWNER TO neondb_owner;

--
-- Name: accompanists; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.accompanists (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(255),
    accompanist_type character varying(20) NOT NULL,
    student_id bigint,
    passport_photo_url text NOT NULL,
    id_proof_url text NOT NULL,
    college_id_card_url text,
    is_team_manager boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by_user_id bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.accompanists OWNER TO neondb_owner;

--
-- Name: accompanists_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.accompanists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accompanists_id_seq OWNER TO neondb_owner;

--
-- Name: accompanists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.accompanists_id_seq OWNED BY public.accompanists.id;


--
-- Name: admin_action_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admin_action_logs (
    id bigint NOT NULL,
    admin_id bigint,
    user_id bigint,
    admin_role character varying(50),
    action_type character varying(100) NOT NULL,
    target_table character varying(100),
    target_id bigint,
    target_college_id bigint,
    old_value jsonb,
    new_value jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_action_logs OWNER TO neondb_owner;

--
-- Name: admin_action_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.admin_action_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_action_logs_id_seq OWNER TO neondb_owner;

--
-- Name: admin_action_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.admin_action_logs_id_seq OWNED BY public.admin_action_logs.id;


--
-- Name: admins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admins (
    id bigint NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp without time zone,
    last_login_ip character varying(45),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admins OWNER TO neondb_owner;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.admins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO neondb_owner;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: application_documents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.application_documents (
    id bigint NOT NULL,
    application_id bigint NOT NULL,
    document_type character varying(50) NOT NULL,
    document_url text NOT NULL,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.application_documents OWNER TO neondb_owner;

--
-- Name: application_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.application_documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.application_documents_id_seq OWNER TO neondb_owner;

--
-- Name: application_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.application_documents_id_seq OWNED BY public.application_documents.id;


--
-- Name: application_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.application_sessions (
    session_id character varying(100) NOT NULL,
    student_id bigint NOT NULL,
    college_id bigint NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.application_sessions OWNER TO neondb_owner;

--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.calendar_events (
    id bigint NOT NULL,
    date date NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(20) NOT NULL,
    place character varying(255) NOT NULL,
    "time" character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    created_by bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.calendar_events OWNER TO neondb_owner;

--
-- Name: calendar_events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.calendar_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calendar_events_id_seq OWNER TO neondb_owner;

--
-- Name: calendar_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.calendar_events_id_seq OWNED BY public.calendar_events.id;


--
-- Name: colleges; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.colleges (
    id bigint NOT NULL,
    college_code character varying(100) NOT NULL,
    college_name character varying(255) NOT NULL,
    place character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    max_quota integer DEFAULT 45 NOT NULL,
    is_final_approved boolean DEFAULT false NOT NULL,
    final_approved_at timestamp without time zone,
    final_approved_by bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    payment_verification_count integer DEFAULT 0 NOT NULL,
    payment_verified_at timestamp without time zone,
    payment_verified_by_admin_id bigint
);


ALTER TABLE public.colleges OWNER TO neondb_owner;

--
-- Name: colleges_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.colleges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.colleges_id_seq OWNER TO neondb_owner;

--
-- Name: colleges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.colleges_id_seq OWNED BY public.colleges.id;


--
-- Name: da_broadcast_email_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.da_broadcast_email_logs (
    id bigint NOT NULL,
    request_id character varying(60) NOT NULL,
    mode character varying(20) NOT NULL,
    subject text NOT NULL,
    sent_to_email text NOT NULL,
    recipient_name text,
    status character varying(10) NOT NULL,
    error_message text,
    gmail_message_id text,
    has_attachment boolean DEFAULT false,
    attachment_filename text,
    triggered_by_admin_id bigint,
    sent_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.da_broadcast_email_logs OWNER TO neondb_owner;

--
-- Name: da_broadcast_email_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.da_broadcast_email_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.da_broadcast_email_logs_id_seq OWNER TO neondb_owner;

--
-- Name: da_broadcast_email_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.da_broadcast_email_logs_id_seq OWNED BY public.da_broadcast_email_logs.id;


--
-- Name: data_admin_audit_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.data_admin_audit_logs (
    id bigint NOT NULL,
    performed_by_admin_id bigint NOT NULL,
    action_type character varying(50) NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id bigint NOT NULL,
    target_snapshot jsonb NOT NULL,
    reason text NOT NULL,
    ip_address character varying(45),
    performed_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.data_admin_audit_logs OWNER TO neondb_owner;

--
-- Name: data_admin_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.data_admin_audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.data_admin_audit_logs_id_seq OWNER TO neondb_owner;

--
-- Name: data_admin_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.data_admin_audit_logs_id_seq OWNED BY public.data_admin_audit_logs.id;


--
-- Name: event_cartooning; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_cartooning (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_cartooning OWNER TO neondb_owner;

--
-- Name: event_cartooning_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_cartooning_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_cartooning_id_seq OWNER TO neondb_owner;

--
-- Name: event_cartooning_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_cartooning_id_seq OWNED BY public.event_cartooning.id;


--
-- Name: event_classical_dance_solo; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_classical_dance_solo (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_classical_dance_solo OWNER TO neondb_owner;

--
-- Name: event_classical_dance_solo_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_classical_dance_solo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_classical_dance_solo_id_seq OWNER TO neondb_owner;

--
-- Name: event_classical_dance_solo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_classical_dance_solo_id_seq OWNED BY public.event_classical_dance_solo.id;


--
-- Name: event_classical_instr_non_percussion; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_classical_instr_non_percussion (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_classical_instr_non_percussion OWNER TO neondb_owner;

--
-- Name: event_classical_instr_non_percussion_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_classical_instr_non_percussion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_classical_instr_non_percussion_id_seq OWNER TO neondb_owner;

--
-- Name: event_classical_instr_non_percussion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_classical_instr_non_percussion_id_seq OWNED BY public.event_classical_instr_non_percussion.id;


--
-- Name: event_classical_instr_percussion; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_classical_instr_percussion (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_classical_instr_percussion OWNER TO neondb_owner;

--
-- Name: event_classical_instr_percussion_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_classical_instr_percussion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_classical_instr_percussion_id_seq OWNER TO neondb_owner;

--
-- Name: event_classical_instr_percussion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_classical_instr_percussion_id_seq OWNED BY public.event_classical_instr_percussion.id;


--
-- Name: event_classical_vocal_solo; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_classical_vocal_solo (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_classical_vocal_solo OWNER TO neondb_owner;

--
-- Name: event_classical_vocal_solo_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_classical_vocal_solo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_classical_vocal_solo_id_seq OWNER TO neondb_owner;

--
-- Name: event_classical_vocal_solo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_classical_vocal_solo_id_seq OWNED BY public.event_classical_vocal_solo.id;


--
-- Name: event_clay_modelling; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_clay_modelling (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_clay_modelling OWNER TO neondb_owner;

--
-- Name: event_clay_modelling_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_clay_modelling_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_clay_modelling_id_seq OWNER TO neondb_owner;

--
-- Name: event_clay_modelling_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_clay_modelling_id_seq OWNED BY public.event_clay_modelling.id;


--
-- Name: event_collage_making; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_collage_making (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_collage_making OWNER TO neondb_owner;

--
-- Name: event_collage_making_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_collage_making_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_collage_making_id_seq OWNER TO neondb_owner;

--
-- Name: event_collage_making_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_collage_making_id_seq OWNED BY public.event_collage_making.id;


--
-- Name: event_debate; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_debate (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_debate OWNER TO neondb_owner;

--
-- Name: event_debate_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_debate_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_debate_id_seq OWNER TO neondb_owner;

--
-- Name: event_debate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_debate_id_seq OWNED BY public.event_debate.id;


--
-- Name: event_elocution; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_elocution (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_elocution OWNER TO neondb_owner;

--
-- Name: event_elocution_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_elocution_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_elocution_id_seq OWNER TO neondb_owner;

--
-- Name: event_elocution_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_elocution_id_seq OWNED BY public.event_elocution.id;


--
-- Name: event_folk_dance; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_folk_dance (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_folk_dance OWNER TO neondb_owner;

--
-- Name: event_folk_dance_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_folk_dance_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_folk_dance_id_seq OWNER TO neondb_owner;

--
-- Name: event_folk_dance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_folk_dance_id_seq OWNED BY public.event_folk_dance.id;


--
-- Name: event_folk_orchestra; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_folk_orchestra (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_folk_orchestra OWNER TO neondb_owner;

--
-- Name: event_folk_orchestra_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_folk_orchestra_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_folk_orchestra_id_seq OWNER TO neondb_owner;

--
-- Name: event_folk_orchestra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_folk_orchestra_id_seq OWNED BY public.event_folk_orchestra.id;


--
-- Name: event_group_song_indian; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_group_song_indian (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_group_song_indian OWNER TO neondb_owner;

--
-- Name: event_group_song_indian_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_group_song_indian_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_group_song_indian_id_seq OWNER TO neondb_owner;

--
-- Name: event_group_song_indian_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_group_song_indian_id_seq OWNED BY public.event_group_song_indian.id;


--
-- Name: event_group_song_western; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_group_song_western (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_group_song_western OWNER TO neondb_owner;

--
-- Name: event_group_song_western_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_group_song_western_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_group_song_western_id_seq OWNER TO neondb_owner;

--
-- Name: event_group_song_western_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_group_song_western_id_seq OWNED BY public.event_group_song_western.id;


--
-- Name: event_installation; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_installation (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_installation OWNER TO neondb_owner;

--
-- Name: event_installation_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_installation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_installation_id_seq OWNER TO neondb_owner;

--
-- Name: event_installation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_installation_id_seq OWNED BY public.event_installation.id;


--
-- Name: event_light_vocal_solo; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_light_vocal_solo (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_light_vocal_solo OWNER TO neondb_owner;

--
-- Name: event_light_vocal_solo_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_light_vocal_solo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_light_vocal_solo_id_seq OWNER TO neondb_owner;

--
-- Name: event_light_vocal_solo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_light_vocal_solo_id_seq OWNED BY public.event_light_vocal_solo.id;


--
-- Name: event_mime; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_mime (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_mime OWNER TO neondb_owner;

--
-- Name: event_mime_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_mime_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_mime_id_seq OWNER TO neondb_owner;

--
-- Name: event_mime_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_mime_id_seq OWNED BY public.event_mime.id;


--
-- Name: event_mimicry; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_mimicry (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_mimicry OWNER TO neondb_owner;

--
-- Name: event_mimicry_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_mimicry_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_mimicry_id_seq OWNER TO neondb_owner;

--
-- Name: event_mimicry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_mimicry_id_seq OWNED BY public.event_mimicry.id;


--
-- Name: event_on_spot_painting; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_on_spot_painting (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_on_spot_painting OWNER TO neondb_owner;

--
-- Name: event_on_spot_painting_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_on_spot_painting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_on_spot_painting_id_seq OWNER TO neondb_owner;

--
-- Name: event_on_spot_painting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_on_spot_painting_id_seq OWNED BY public.event_on_spot_painting.id;


--
-- Name: event_one_act_play; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_one_act_play (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_one_act_play OWNER TO neondb_owner;

--
-- Name: event_one_act_play_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_one_act_play_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_one_act_play_id_seq OWNER TO neondb_owner;

--
-- Name: event_one_act_play_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_one_act_play_id_seq OWNED BY public.event_one_act_play.id;


--
-- Name: event_participation_snapshot; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_participation_snapshot (
    id bigint NOT NULL,
    participant_id bigint,
    student_id bigint,
    accompanist_id bigint,
    college_id bigint NOT NULL,
    event_name character varying(100) NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.event_participation_snapshot OWNER TO neondb_owner;

--
-- Name: event_participation_snapshot_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_participation_snapshot_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_participation_snapshot_id_seq OWNER TO neondb_owner;

--
-- Name: event_participation_snapshot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_participation_snapshot_id_seq OWNED BY public.event_participation_snapshot.id;


--
-- Name: event_poster_making; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_poster_making (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_poster_making OWNER TO neondb_owner;

--
-- Name: event_poster_making_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_poster_making_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_poster_making_id_seq OWNER TO neondb_owner;

--
-- Name: event_poster_making_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_poster_making_id_seq OWNED BY public.event_poster_making.id;


--
-- Name: event_quiz; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_quiz (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_quiz OWNER TO neondb_owner;

--
-- Name: event_quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_quiz_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_quiz_id_seq OWNER TO neondb_owner;

--
-- Name: event_quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_quiz_id_seq OWNED BY public.event_quiz.id;


--
-- Name: event_rangoli; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_rangoli (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_rangoli OWNER TO neondb_owner;

--
-- Name: event_rangoli_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_rangoli_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_rangoli_id_seq OWNER TO neondb_owner;

--
-- Name: event_rangoli_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_rangoli_id_seq OWNED BY public.event_rangoli.id;


--
-- Name: event_skits; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_skits (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_skits OWNER TO neondb_owner;

--
-- Name: event_skits_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_skits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_skits_id_seq OWNER TO neondb_owner;

--
-- Name: event_skits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_skits_id_seq OWNED BY public.event_skits.id;


--
-- Name: event_spot_photography; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_spot_photography (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_spot_photography OWNER TO neondb_owner;

--
-- Name: event_spot_photography_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_spot_photography_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_spot_photography_id_seq OWNER TO neondb_owner;

--
-- Name: event_spot_photography_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_spot_photography_id_seq OWNED BY public.event_spot_photography.id;


--
-- Name: event_western_vocal_solo; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_western_vocal_solo (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_name character varying(255) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    person_type character varying(20) NOT NULL,
    event_type character varying(30) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attendance_marked_by bigint,
    attendance_marked_at timestamp without time zone,
    attendance character varying(10) DEFAULT NULL::character varying
);


ALTER TABLE public.event_western_vocal_solo OWNER TO neondb_owner;

--
-- Name: event_western_vocal_solo_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.event_western_vocal_solo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_western_vocal_solo_id_seq OWNER TO neondb_owner;

--
-- Name: event_western_vocal_solo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.event_western_vocal_solo_id_seq OWNED BY public.event_western_vocal_solo.id;


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.feedback (
    id bigint NOT NULL,
    role character varying(20) NOT NULL,
    student_id bigint,
    user_id bigint,
    full_name character varying(255) NOT NULL,
    college_id bigint,
    college_name character varying(255) NOT NULL,
    trigger_event character varying(50) NOT NULL,
    rating_overall smallint NOT NULL,
    rating_ease_of_use smallint NOT NULL,
    rating_role_specific smallint NOT NULL,
    text_liked text,
    text_difficult text,
    text_suggestions text,
    submitted_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT feedback_rating_ease_of_use_check CHECK (((rating_ease_of_use >= 1) AND (rating_ease_of_use <= 5))),
    CONSTRAINT feedback_rating_overall_check CHECK (((rating_overall >= 1) AND (rating_overall <= 5))),
    CONSTRAINT feedback_rating_role_specific_check CHECK (((rating_role_specific >= 1) AND (rating_role_specific <= 5))),
    CONSTRAINT feedback_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'manager'::character varying, 'principal'::character varying])::text[]))),
    CONSTRAINT feedback_trigger_event_check CHECK (((trigger_event)::text = ANY ((ARRAY['application_submitted'::character varying, 'payment_proof_uploaded'::character varying, 'final_approval_given'::character varying, 'manual'::character varying])::text[])))
);


ALTER TABLE public.feedback OWNER TO neondb_owner;

--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_id_seq OWNER TO neondb_owner;

--
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.feedback_id_seq OWNED BY public.feedback.id;


--
-- Name: final_event_participants_master; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.final_event_participants_master (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    person_type character varying(30) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    passport_photo_url text,
    id_proof_url text,
    qr_code character varying(20),
    qr_assigned_at timestamp without time zone,
    final_approved_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    final_approved_by bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    usn character varying(50),
    gender character varying(10),
    blood_group character varying(5),
    address character varying(500),
    department character varying(100),
    year_of_study integer,
    semester integer,
    college_code character varying(100),
    college_name character varying(255),
    aadhaar_url text,
    college_id_card_url text,
    sslc_url text,
    accompanist_type character varying(20),
    is_team_manager boolean DEFAULT false,
    application_id bigint,
    id_card_activated boolean DEFAULT false NOT NULL,
    id_card_activated_by bigint,
    id_card_activated_at timestamp without time zone
);


ALTER TABLE public.final_event_participants_master OWNER TO neondb_owner;

--
-- Name: final_event_participants_master_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.final_event_participants_master_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.final_event_participants_master_id_seq OWNER TO neondb_owner;

--
-- Name: final_event_participants_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.final_event_participants_master_id_seq OWNED BY public.final_event_participants_master.id;


--
-- Name: green_room_allocations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.green_room_allocations (
    id bigint NOT NULL,
    request_id bigint NOT NULL,
    college_id bigint NOT NULL,
    building_name character varying(255) NOT NULL,
    floor_number character varying(50) NOT NULL,
    room_number character varying(50) NOT NULL,
    capacity integer NOT NULL,
    notes text,
    allocated_by bigint,
    allocated_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT green_room_allocations_capacity_check CHECK ((capacity > 0))
);


ALTER TABLE public.green_room_allocations OWNER TO neondb_owner;

--
-- Name: green_room_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.green_room_allocations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.green_room_allocations_id_seq OWNER TO neondb_owner;

--
-- Name: green_room_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.green_room_allocations_id_seq OWNED BY public.green_room_allocations.id;


--
-- Name: green_room_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.green_room_requests (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    total_participants integer NOT NULL,
    contact_person_name character varying(255) NOT NULL,
    contact_person_phone character varying(20) NOT NULL,
    special_requirements text,
    status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    rejection_reason text,
    applied_by_user_id bigint,
    applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp without time zone,
    CONSTRAINT green_room_requests_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'ALLOCATED'::character varying, 'REJECTED'::character varying, 'CANCELLED'::character varying])::text[]))),
    CONSTRAINT green_room_requests_total_participants_check CHECK ((total_participants > 0))
);


ALTER TABLE public.green_room_requests OWNER TO neondb_owner;

--
-- Name: green_room_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.green_room_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.green_room_requests_id_seq OWNER TO neondb_owner;

--
-- Name: green_room_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.green_room_requests_id_seq OWNED BY public.green_room_requests.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    message text NOT NULL,
    type character varying(50) NOT NULL,
    priority integer DEFAULT 2 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp without time zone,
    created_by bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: payment_receipts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payment_receipts (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    college_code character varying(100) NOT NULL,
    college_name character varying(255) NOT NULL,
    receipt_url text NOT NULL,
    amount_paid integer NOT NULL,
    utr_reference_number character varying(100) NOT NULL,
    uploaded_by_name character varying(255) NOT NULL,
    uploaded_by_type character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'waiting_for_verification'::character varying NOT NULL,
    admin_remarks text,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    verified_by bigint,
    verified_at timestamp without time zone,
    reapply_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.payment_receipts OWNER TO neondb_owner;

--
-- Name: payment_receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.payment_receipts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_receipts_id_seq OWNER TO neondb_owner;

--
-- Name: payment_receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.payment_receipts_id_seq OWNED BY public.payment_receipts.id;


--
-- Name: payment_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payment_sessions (
    session_id character varying(100) NOT NULL,
    college_id bigint NOT NULL,
    amount_paid integer NOT NULL,
    utr_reference_number character varying(100) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payment_sessions OWNER TO neondb_owner;

--
-- Name: principal_email_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.principal_email_logs (
    id bigint NOT NULL,
    principal_user_id bigint NOT NULL,
    college_id bigint NOT NULL,
    sent_to_email character varying(255) NOT NULL,
    triggered_by_admin_id bigint NOT NULL,
    status character varying(20) NOT NULL,
    error_message text,
    gmail_message_id character varying(255),
    is_bulk boolean DEFAULT false NOT NULL,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT principal_email_logs_status_check CHECK (((status)::text = ANY ((ARRAY['SUCCESS'::character varying, 'FAILED'::character varying])::text[])))
);


ALTER TABLE public.principal_email_logs OWNER TO neondb_owner;

--
-- Name: principal_email_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.principal_email_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.principal_email_logs_id_seq OWNER TO neondb_owner;

--
-- Name: principal_email_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.principal_email_logs_id_seq OWNED BY public.principal_email_logs.id;


--
-- Name: private_qr_pool; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.private_qr_pool (
    id bigint NOT NULL,
    qr_code character varying(20) NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    assigned_to_volunteer_id bigint,
    assigned_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.private_qr_pool OWNER TO neondb_owner;

--
-- Name: private_qr_pool_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.private_qr_pool_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.private_qr_pool_id_seq OWNER TO neondb_owner;

--
-- Name: private_qr_pool_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.private_qr_pool_id_seq OWNED BY public.private_qr_pool.id;


--
-- Name: qr_code_pool; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.qr_code_pool (
    id bigint NOT NULL,
    qr_code character varying(20) NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    assigned_to_person_id bigint,
    assigned_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.qr_code_pool OWNER TO neondb_owner;

--
-- Name: qr_code_pool_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.qr_code_pool_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.qr_code_pool_id_seq OWNER TO neondb_owner;

--
-- Name: qr_code_pool_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.qr_code_pool_id_seq OWNED BY public.qr_code_pool.id;


--
-- Name: registration_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.registration_sessions (
    session_id character varying(100) NOT NULL,
    usn character varying(50) NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    gender character varying(10) NOT NULL,
    college_id bigint NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.registration_sessions OWNER TO neondb_owner;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.settings (
    id bigint NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value text NOT NULL,
    value_type character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_by bigint,
    CONSTRAINT settings_value_type_check CHECK (((value_type)::text = ANY ((ARRAY['BOOLEAN'::character varying, 'STRING'::character varying, 'NUMBER'::character varying, 'JSON'::character varying])::text[])))
);


ALTER TABLE public.settings OWNER TO neondb_owner;

--
-- Name: settings_audit_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.settings_audit_logs (
    id bigint NOT NULL,
    setting_id bigint NOT NULL,
    old_value text,
    new_value text,
    changed_by bigint NOT NULL,
    changed_at timestamp without time zone DEFAULT now() NOT NULL,
    change_reason text
);


ALTER TABLE public.settings_audit_logs OWNER TO neondb_owner;

--
-- Name: settings_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.settings_audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_audit_logs_id_seq OWNER TO neondb_owner;

--
-- Name: settings_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.settings_audit_logs_id_seq OWNED BY public.settings_audit_logs.id;


--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_id_seq OWNER TO neondb_owner;

--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: student_applications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.student_applications (
    id bigint NOT NULL,
    student_id bigint NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_at timestamp without time zone,
    rejected_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    blood_group character varying(5),
    address character varying(500),
    department character varying(100),
    year_of_study integer,
    semester integer,
    college_code character varying(20)
);


ALTER TABLE public.student_applications OWNER TO neondb_owner;

--
-- Name: student_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.student_applications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_applications_id_seq OWNER TO neondb_owner;

--
-- Name: student_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.student_applications_id_seq OWNED BY public.student_applications.id;


--
-- Name: students; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.students (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    full_name character varying(255) NOT NULL,
    usn character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    gender character varying(10) NOT NULL,
    passport_photo_url text NOT NULL,
    password_hash character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    reapply_count integer DEFAULT 0 NOT NULL,
    last_login_at timestamp without time zone,
    last_dashboard_fetch_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    password_reset_token character varying(255),
    password_reset_expires timestamp without time zone,
    feedback_status character varying(10) DEFAULT 'not_shown'::character varying,
    onboarding_completed boolean DEFAULT false NOT NULL,
    onboarding_completed_at timestamp without time zone,
    CONSTRAINT students_feedback_status_check CHECK (((feedback_status)::text = ANY ((ARRAY['not_shown'::character varying, 'given'::character varying, 'skipped'::character varying])::text[])))
);


ALTER TABLE public.students OWNER TO neondb_owner;

--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.students_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO neondb_owner;

--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: temp_event_participants_master; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.temp_event_participants_master (
    id bigint NOT NULL,
    college_id bigint NOT NULL,
    person_type character varying(30) NOT NULL,
    student_id bigint,
    accompanist_id bigint,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    passport_photo_url text,
    id_proof_url text,
    usn character varying(50),
    gender character varying(10),
    blood_group character varying(5),
    address character varying(500),
    department character varying(100),
    year_of_study integer,
    semester integer,
    college_code character varying(100),
    college_name character varying(255),
    aadhaar_url text,
    college_id_card_url text,
    sslc_url text,
    accompanist_type character varying(20),
    is_team_manager boolean DEFAULT false,
    application_id bigint,
    final_approved_by bigint,
    final_approved_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.temp_event_participants_master OWNER TO neondb_owner;

--
-- Name: temp_event_participants_master_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.temp_event_participants_master_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.temp_event_participants_master_id_seq OWNER TO neondb_owner;

--
-- Name: temp_event_participants_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.temp_event_participants_master_id_seq OWNED BY public.temp_event_participants_master.id;


--
-- Name: temp_event_participation_snapshot; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.temp_event_participation_snapshot (
    id bigint NOT NULL,
    participant_id bigint,
    student_id bigint,
    accompanist_id bigint,
    college_id bigint NOT NULL,
    event_name character varying(100) NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.temp_event_participation_snapshot OWNER TO neondb_owner;

--
-- Name: temp_event_participation_snapshot_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.temp_event_participation_snapshot_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.temp_event_participation_snapshot_id_seq OWNER TO neondb_owner;

--
-- Name: temp_event_participation_snapshot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.temp_event_participation_snapshot_id_seq OWNED BY public.temp_event_participation_snapshot.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    college_id bigint,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    force_password_reset boolean DEFAULT false NOT NULL,
    password_reset_token character varying(255),
    password_reset_expires timestamp without time zone,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    profile_completed boolean DEFAULT false,
    feedback_status character varying(10) DEFAULT 'not_shown'::character varying,
    email_sent boolean DEFAULT false NOT NULL,
    onboarding_completed boolean DEFAULT false NOT NULL,
    onboarding_completed_at timestamp without time zone,
    CONSTRAINT users_feedback_status_check CHECK (((feedback_status)::text = ANY ((ARRAY['not_shown'::character varying, 'given'::character varying, 'skipped'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: volunteer_event_assignments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.volunteer_event_assignments (
    id bigint NOT NULL,
    volunteer_id bigint NOT NULL,
    event_name character varying(100) NOT NULL,
    assigned_by bigint,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.volunteer_event_assignments OWNER TO neondb_owner;

--
-- Name: volunteer_event_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.volunteer_event_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.volunteer_event_assignments_id_seq OWNER TO neondb_owner;

--
-- Name: volunteer_event_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.volunteer_event_assignments_id_seq OWNED BY public.volunteer_event_assignments.id;


--
-- Name: volunteers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.volunteers (
    id bigint NOT NULL,
    college_id bigint,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    password_hash character varying(255) NOT NULL,
    volunteer_type character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    force_password_reset boolean DEFAULT false NOT NULL,
    password_reset_token character varying(255),
    password_reset_expires timestamp without time zone,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    auid character varying(20),
    qr_code character varying(20)
);


ALTER TABLE public.volunteers OWNER TO neondb_owner;

--
-- Name: volunteers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.volunteers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.volunteers_id_seq OWNER TO neondb_owner;

--
-- Name: volunteers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.volunteers_id_seq OWNED BY public.volunteers.id;


--
-- Name: accommodation_allotments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accommodation_allotments ALTER COLUMN id SET DEFAULT nextval('public.accommodation_allotments_id_seq'::regclass);


--
-- Name: accommodation_requests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accommodation_requests ALTER COLUMN id SET DEFAULT nextval('public.accommodation_requests_id_seq'::regclass);


--
-- Name: accompanists id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accompanists ALTER COLUMN id SET DEFAULT nextval('public.accompanists_id_seq'::regclass);


--
-- Name: admin_action_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_action_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_action_logs_id_seq'::regclass);


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: application_documents id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.application_documents ALTER COLUMN id SET DEFAULT nextval('public.application_documents_id_seq'::regclass);


--
-- Name: calendar_events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.calendar_events ALTER COLUMN id SET DEFAULT nextval('public.calendar_events_id_seq'::regclass);


--
-- Name: colleges id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.colleges ALTER COLUMN id SET DEFAULT nextval('public.colleges_id_seq'::regclass);


--
-- Name: da_broadcast_email_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.da_broadcast_email_logs ALTER COLUMN id SET DEFAULT nextval('public.da_broadcast_email_logs_id_seq'::regclass);


--
-- Name: data_admin_audit_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.data_admin_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.data_admin_audit_logs_id_seq'::regclass);


--
-- Name: event_cartooning id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_cartooning ALTER COLUMN id SET DEFAULT nextval('public.event_cartooning_id_seq'::regclass);


--
-- Name: event_classical_dance_solo id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_dance_solo ALTER COLUMN id SET DEFAULT nextval('public.event_classical_dance_solo_id_seq'::regclass);


--
-- Name: event_classical_instr_non_percussion id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_instr_non_percussion ALTER COLUMN id SET DEFAULT nextval('public.event_classical_instr_non_percussion_id_seq'::regclass);


--
-- Name: event_classical_instr_percussion id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_instr_percussion ALTER COLUMN id SET DEFAULT nextval('public.event_classical_instr_percussion_id_seq'::regclass);


--
-- Name: event_classical_vocal_solo id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_vocal_solo ALTER COLUMN id SET DEFAULT nextval('public.event_classical_vocal_solo_id_seq'::regclass);


--
-- Name: event_clay_modelling id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_clay_modelling ALTER COLUMN id SET DEFAULT nextval('public.event_clay_modelling_id_seq'::regclass);


--
-- Name: event_collage_making id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_collage_making ALTER COLUMN id SET DEFAULT nextval('public.event_collage_making_id_seq'::regclass);


--
-- Name: event_debate id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_debate ALTER COLUMN id SET DEFAULT nextval('public.event_debate_id_seq'::regclass);


--
-- Name: event_elocution id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_elocution ALTER COLUMN id SET DEFAULT nextval('public.event_elocution_id_seq'::regclass);


--
-- Name: event_folk_dance id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_folk_dance ALTER COLUMN id SET DEFAULT nextval('public.event_folk_dance_id_seq'::regclass);


--
-- Name: event_folk_orchestra id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_folk_orchestra ALTER COLUMN id SET DEFAULT nextval('public.event_folk_orchestra_id_seq'::regclass);


--
-- Name: event_group_song_indian id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_group_song_indian ALTER COLUMN id SET DEFAULT nextval('public.event_group_song_indian_id_seq'::regclass);


--
-- Name: event_group_song_western id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_group_song_western ALTER COLUMN id SET DEFAULT nextval('public.event_group_song_western_id_seq'::regclass);


--
-- Name: event_installation id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_installation ALTER COLUMN id SET DEFAULT nextval('public.event_installation_id_seq'::regclass);


--
-- Name: event_light_vocal_solo id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_light_vocal_solo ALTER COLUMN id SET DEFAULT nextval('public.event_light_vocal_solo_id_seq'::regclass);


--
-- Name: event_mime id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_mime ALTER COLUMN id SET DEFAULT nextval('public.event_mime_id_seq'::regclass);


--
-- Name: event_mimicry id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_mimicry ALTER COLUMN id SET DEFAULT nextval('public.event_mimicry_id_seq'::regclass);


--
-- Name: event_on_spot_painting id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_on_spot_painting ALTER COLUMN id SET DEFAULT nextval('public.event_on_spot_painting_id_seq'::regclass);


--
-- Name: event_one_act_play id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_one_act_play ALTER COLUMN id SET DEFAULT nextval('public.event_one_act_play_id_seq'::regclass);


--
-- Name: event_participation_snapshot id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_participation_snapshot ALTER COLUMN id SET DEFAULT nextval('public.event_participation_snapshot_id_seq'::regclass);


--
-- Name: event_poster_making id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_poster_making ALTER COLUMN id SET DEFAULT nextval('public.event_poster_making_id_seq'::regclass);


--
-- Name: event_quiz id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_quiz ALTER COLUMN id SET DEFAULT nextval('public.event_quiz_id_seq'::regclass);


--
-- Name: event_rangoli id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_rangoli ALTER COLUMN id SET DEFAULT nextval('public.event_rangoli_id_seq'::regclass);


--
-- Name: event_skits id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_skits ALTER COLUMN id SET DEFAULT nextval('public.event_skits_id_seq'::regclass);


--
-- Name: event_spot_photography id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_spot_photography ALTER COLUMN id SET DEFAULT nextval('public.event_spot_photography_id_seq'::regclass);


--
-- Name: event_western_vocal_solo id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_western_vocal_solo ALTER COLUMN id SET DEFAULT nextval('public.event_western_vocal_solo_id_seq'::regclass);


--
-- Name: feedback id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback ALTER COLUMN id SET DEFAULT nextval('public.feedback_id_seq'::regclass);


--
-- Name: final_event_participants_master id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.final_event_participants_master ALTER COLUMN id SET DEFAULT nextval('public.final_event_participants_master_id_seq'::regclass);


--
-- Name: green_room_allocations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.green_room_allocations ALTER COLUMN id SET DEFAULT nextval('public.green_room_allocations_id_seq'::regclass);


--
-- Name: green_room_requests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.green_room_requests ALTER COLUMN id SET DEFAULT nextval('public.green_room_requests_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: payment_receipts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_receipts ALTER COLUMN id SET DEFAULT nextval('public.payment_receipts_id_seq'::regclass);


--
-- Name: principal_email_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.principal_email_logs ALTER COLUMN id SET DEFAULT nextval('public.principal_email_logs_id_seq'::regclass);


--
-- Name: private_qr_pool id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.private_qr_pool ALTER COLUMN id SET DEFAULT nextval('public.private_qr_pool_id_seq'::regclass);


--
-- Name: qr_code_pool id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.qr_code_pool ALTER COLUMN id SET DEFAULT nextval('public.qr_code_pool_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: settings_audit_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.settings_audit_logs_id_seq'::regclass);


--
-- Name: student_applications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.student_applications ALTER COLUMN id SET DEFAULT nextval('public.student_applications_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: temp_event_participants_master id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.temp_event_participants_master ALTER COLUMN id SET DEFAULT nextval('public.temp_event_participants_master_id_seq'::regclass);


--
-- Name: temp_event_participation_snapshot id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.temp_event_participation_snapshot ALTER COLUMN id SET DEFAULT nextval('public.temp_event_participation_snapshot_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: volunteer_event_assignments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.volunteer_event_assignments ALTER COLUMN id SET DEFAULT nextval('public.volunteer_event_assignments_id_seq'::regclass);


--
-- Name: volunteers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.volunteers ALTER COLUMN id SET DEFAULT nextval('public.volunteers_id_seq'::regclass);


--
-- Name: accommodation_allotments accommodation_allotments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accommodation_allotments
    ADD CONSTRAINT accommodation_allotments_pkey PRIMARY KEY (id);


--
-- Name: accommodation_requests accommodation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accommodation_requests
    ADD CONSTRAINT accommodation_requests_pkey PRIMARY KEY (id);


--
-- Name: accompanist_sessions accompanist_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accompanist_sessions
    ADD CONSTRAINT accompanist_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: accompanists accompanists_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accompanists
    ADD CONSTRAINT accompanists_pkey PRIMARY KEY (id);


--
-- Name: admin_action_logs admin_action_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_action_logs
    ADD CONSTRAINT admin_action_logs_pkey PRIMARY KEY (id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: application_documents application_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.application_documents
    ADD CONSTRAINT application_documents_pkey PRIMARY KEY (id);


--
-- Name: application_sessions application_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.application_sessions
    ADD CONSTRAINT application_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: colleges colleges_college_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.colleges
    ADD CONSTRAINT colleges_college_code_key UNIQUE (college_code);


--
-- Name: colleges colleges_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.colleges
    ADD CONSTRAINT colleges_pkey PRIMARY KEY (id);


--
-- Name: da_broadcast_email_logs da_broadcast_email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.da_broadcast_email_logs
    ADD CONSTRAINT da_broadcast_email_logs_pkey PRIMARY KEY (id);


--
-- Name: data_admin_audit_logs data_admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.data_admin_audit_logs
    ADD CONSTRAINT data_admin_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: event_cartooning event_cartooning_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_cartooning
    ADD CONSTRAINT event_cartooning_pkey PRIMARY KEY (id);


--
-- Name: event_classical_dance_solo event_classical_dance_solo_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_dance_solo
    ADD CONSTRAINT event_classical_dance_solo_pkey PRIMARY KEY (id);


--
-- Name: event_classical_instr_non_percussion event_classical_instr_non_percussion_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_instr_non_percussion
    ADD CONSTRAINT event_classical_instr_non_percussion_pkey PRIMARY KEY (id);


--
-- Name: event_classical_instr_percussion event_classical_instr_percussion_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_instr_percussion
    ADD CONSTRAINT event_classical_instr_percussion_pkey PRIMARY KEY (id);


--
-- Name: event_classical_vocal_solo event_classical_vocal_solo_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_vocal_solo
    ADD CONSTRAINT event_classical_vocal_solo_pkey PRIMARY KEY (id);


--
-- Name: event_clay_modelling event_clay_modelling_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_clay_modelling
    ADD CONSTRAINT event_clay_modelling_pkey PRIMARY KEY (id);


--
-- Name: event_collage_making event_collage_making_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_collage_making
    ADD CONSTRAINT event_collage_making_pkey PRIMARY KEY (id);


--
-- Name: event_debate event_debate_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_debate
    ADD CONSTRAINT event_debate_pkey PRIMARY KEY (id);


--
-- Name: event_elocution event_elocution_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_elocution
    ADD CONSTRAINT event_elocution_pkey PRIMARY KEY (id);


--
-- Name: event_folk_dance event_folk_dance_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_folk_dance
    ADD CONSTRAINT event_folk_dance_pkey PRIMARY KEY (id);


--
-- Name: event_folk_orchestra event_folk_orchestra_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_folk_orchestra
    ADD CONSTRAINT event_folk_orchestra_pkey PRIMARY KEY (id);


--
-- Name: event_group_song_indian event_group_song_indian_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_group_song_indian
    ADD CONSTRAINT event_group_song_indian_pkey PRIMARY KEY (id);


--
-- Name: event_group_song_western event_group_song_western_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_group_song_western
    ADD CONSTRAINT event_group_song_western_pkey PRIMARY KEY (id);


--
-- Name: event_installation event_installation_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_installation
    ADD CONSTRAINT event_installation_pkey PRIMARY KEY (id);


--
-- Name: event_light_vocal_solo event_light_vocal_solo_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_light_vocal_solo
    ADD CONSTRAINT event_light_vocal_solo_pkey PRIMARY KEY (id);


--
-- Name: event_mime event_mime_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_mime
    ADD CONSTRAINT event_mime_pkey PRIMARY KEY (id);


--
-- Name: event_mimicry event_mimicry_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_mimicry
    ADD CONSTRAINT event_mimicry_pkey PRIMARY KEY (id);


--
-- Name: event_on_spot_painting event_on_spot_painting_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_on_spot_painting
    ADD CONSTRAINT event_on_spot_painting_pkey PRIMARY KEY (id);


--
-- Name: event_one_act_play event_one_act_play_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_one_act_play
    ADD CONSTRAINT event_one_act_play_pkey PRIMARY KEY (id);


--
-- Name: event_participation_snapshot event_participation_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_participation_snapshot
    ADD CONSTRAINT event_participation_snapshot_pkey PRIMARY KEY (id);


--
-- Name: event_poster_making event_poster_making_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_poster_making
    ADD CONSTRAINT event_poster_making_pkey PRIMARY KEY (id);


--
-- Name: event_quiz event_quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_quiz
    ADD CONSTRAINT event_quiz_pkey PRIMARY KEY (id);


--
-- Name: event_rangoli event_rangoli_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_rangoli
    ADD CONSTRAINT event_rangoli_pkey PRIMARY KEY (id);


--
-- Name: event_skits event_skits_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_skits
    ADD CONSTRAINT event_skits_pkey PRIMARY KEY (id);


--
-- Name: event_spot_photography event_spot_photography_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_spot_photography
    ADD CONSTRAINT event_spot_photography_pkey PRIMARY KEY (id);


--
-- Name: event_western_vocal_solo event_western_vocal_solo_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_western_vocal_solo
    ADD CONSTRAINT event_western_vocal_solo_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: final_event_participants_master final_event_participants_master_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.final_event_participants_master
    ADD CONSTRAINT final_event_participants_master_pkey PRIMARY KEY (id);


--
-- Name: final_event_participants_master final_event_participants_master_qr_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.final_event_participants_master
    ADD CONSTRAINT final_event_participants_master_qr_code_key UNIQUE (qr_code);


--
-- Name: green_room_allocations green_room_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.green_room_allocations
    ADD CONSTRAINT green_room_allocations_pkey PRIMARY KEY (id);


--
-- Name: green_room_requests green_room_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.green_room_requests
    ADD CONSTRAINT green_room_requests_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payment_receipts payment_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_pkey PRIMARY KEY (id);


--
-- Name: payment_receipts payment_receipts_utr_reference_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_utr_reference_number_key UNIQUE (utr_reference_number);


--
-- Name: payment_sessions payment_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_sessions
    ADD CONSTRAINT payment_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: principal_email_logs principal_email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.principal_email_logs
    ADD CONSTRAINT principal_email_logs_pkey PRIMARY KEY (id);


--
-- Name: private_qr_pool private_qr_pool_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.private_qr_pool
    ADD CONSTRAINT private_qr_pool_pkey PRIMARY KEY (id);


--
-- Name: private_qr_pool private_qr_pool_qr_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.private_qr_pool
    ADD CONSTRAINT private_qr_pool_qr_code_key UNIQUE (qr_code);


--
-- Name: qr_code_pool qr_code_pool_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.qr_code_pool
    ADD CONSTRAINT qr_code_pool_pkey PRIMARY KEY (id);


--
-- Name: qr_code_pool qr_code_pool_qr_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.qr_code_pool
    ADD CONSTRAINT qr_code_pool_qr_code_key UNIQUE (qr_code);


--
-- Name: registration_sessions registration_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.registration_sessions
    ADD CONSTRAINT registration_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: settings_audit_logs settings_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings_audit_logs
    ADD CONSTRAINT settings_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: settings settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_setting_key_key UNIQUE (setting_key);


--
-- Name: student_applications student_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.student_applications
    ADD CONSTRAINT student_applications_pkey PRIMARY KEY (id);


--
-- Name: students students_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_email_key UNIQUE (email);


--
-- Name: students students_phone_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_phone_key UNIQUE (phone);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_usn_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_usn_key UNIQUE (usn);


--
-- Name: temp_event_participants_master temp_event_participants_master_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.temp_event_participants_master
    ADD CONSTRAINT temp_event_participants_master_pkey PRIMARY KEY (id);


--
-- Name: temp_event_participation_snapshot temp_event_participation_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.temp_event_participation_snapshot
    ADD CONSTRAINT temp_event_participation_snapshot_pkey PRIMARY KEY (id);


--
-- Name: green_room_allocations uq_green_room_allocations_college; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.green_room_allocations
    ADD CONSTRAINT uq_green_room_allocations_college UNIQUE (college_id);


--
-- Name: green_room_allocations uq_green_room_allocations_request; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.green_room_allocations
    ADD CONSTRAINT uq_green_room_allocations_request UNIQUE (request_id);


--
-- Name: green_room_allocations uq_green_room_allocations_room; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.green_room_allocations
    ADD CONSTRAINT uq_green_room_allocations_room UNIQUE (building_name, floor_number, room_number);


--
-- Name: green_room_requests uq_green_room_requests_college; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.green_room_requests
    ADD CONSTRAINT uq_green_room_requests_college UNIQUE (college_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: volunteer_event_assignments volunteer_event_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.volunteer_event_assignments
    ADD CONSTRAINT volunteer_event_assignments_pkey PRIMARY KEY (id);


--
-- Name: volunteer_event_assignments volunteer_event_assignments_volunteer_id_event_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.volunteer_event_assignments
    ADD CONSTRAINT volunteer_event_assignments_volunteer_id_event_name_key UNIQUE (volunteer_id, event_name);


--
-- Name: volunteers volunteers_auid_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_auid_key UNIQUE (auid);


--
-- Name: volunteers volunteers_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_email_key UNIQUE (email);


--
-- Name: volunteers volunteers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_pkey PRIMARY KEY (id);


--
-- Name: volunteers volunteers_qr_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_qr_code_key UNIQUE (qr_code);


--
-- Name: idx_accommodation_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_accommodation_college ON public.accommodation_requests USING btree (college_id);


--
-- Name: idx_accommodation_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_accommodation_status ON public.accommodation_requests USING btree (status);


--
-- Name: idx_accomp_session_expires; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_accomp_session_expires ON public.accompanist_sessions USING btree (expires_at);


--
-- Name: idx_accompanists_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_accompanists_college ON public.accompanists USING btree (college_id);


--
-- Name: idx_accompanists_phone; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_accompanists_phone ON public.accompanists USING btree (phone);


--
-- Name: idx_allotments_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_allotments_college ON public.accommodation_allotments USING btree (college_id);


--
-- Name: idx_allotments_request; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_allotments_request ON public.accommodation_allotments USING btree (request_id);


--
-- Name: idx_app_session_expires; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_app_session_expires ON public.application_sessions USING btree (expires_at);


--
-- Name: idx_application_documents_application_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_application_documents_application_id ON public.application_documents USING btree (application_id);


--
-- Name: idx_applications_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_applications_status ON public.student_applications USING btree (status);


--
-- Name: idx_applications_student; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_applications_student ON public.student_applications USING btree (student_id);


--
-- Name: idx_colleges_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_colleges_active ON public.colleges USING btree (is_active);


--
-- Name: idx_colleges_code; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_colleges_code ON public.colleges USING btree (college_code);


--
-- Name: idx_documents_application; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_documents_application ON public.application_documents USING btree (application_id);


--
-- Name: idx_eps_accompanist; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_eps_accompanist ON public.event_participation_snapshot USING btree (accompanist_id);


--
-- Name: idx_eps_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_eps_college ON public.event_participation_snapshot USING btree (college_id);


--
-- Name: idx_eps_event; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_eps_event ON public.event_participation_snapshot USING btree (event_name);


--
-- Name: idx_eps_event_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_eps_event_college ON public.event_participation_snapshot USING btree (event_name, college_id);


--
-- Name: idx_eps_event_name; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_eps_event_name ON public.event_participation_snapshot USING btree (event_name);


--
-- Name: idx_eps_participant; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_eps_participant ON public.event_participation_snapshot USING btree (participant_id);


--
-- Name: idx_eps_participant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_eps_participant_id ON public.event_participation_snapshot USING btree (participant_id);


--
-- Name: idx_eps_participant_role; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_eps_participant_role ON public.event_participation_snapshot USING btree (participant_id, role);


--
-- Name: idx_eps_student; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_eps_student ON public.event_participation_snapshot USING btree (student_id);


--
-- Name: idx_event_cartooning_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_cartooning_college ON public.event_cartooning USING btree (college_id);


--
-- Name: idx_event_classical_dance_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_classical_dance_college ON public.event_classical_dance_solo USING btree (college_id);


--
-- Name: idx_event_classical_instr_non_perc_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_classical_instr_non_perc_college ON public.event_classical_instr_non_percussion USING btree (college_id);


--
-- Name: idx_event_classical_instr_perc_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_classical_instr_perc_college ON public.event_classical_instr_percussion USING btree (college_id);


--
-- Name: idx_event_classical_vocal_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_classical_vocal_college ON public.event_classical_vocal_solo USING btree (college_id);


--
-- Name: idx_event_clay_modelling_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_clay_modelling_college ON public.event_clay_modelling USING btree (college_id);


--
-- Name: idx_event_collage_making_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_collage_making_college ON public.event_collage_making USING btree (college_id);


--
-- Name: idx_event_debate_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_debate_college ON public.event_debate USING btree (college_id);


--
-- Name: idx_event_elocution_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_elocution_college ON public.event_elocution USING btree (college_id);


--
-- Name: idx_event_folk_dance_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_folk_dance_college ON public.event_folk_dance USING btree (college_id);


--
-- Name: idx_event_folk_orchestra_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_folk_orchestra_college ON public.event_folk_orchestra USING btree (college_id);


--
-- Name: idx_event_group_song_indian_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_group_song_indian_college ON public.event_group_song_indian USING btree (college_id);


--
-- Name: idx_event_group_song_western_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_group_song_western_college ON public.event_group_song_western USING btree (college_id);


--
-- Name: idx_event_installation_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_installation_college ON public.event_installation USING btree (college_id);


--
-- Name: idx_event_light_vocal_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_light_vocal_college ON public.event_light_vocal_solo USING btree (college_id);


--
-- Name: idx_event_mime_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_mime_college ON public.event_mime USING btree (college_id);


--
-- Name: idx_event_mimicry_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_mimicry_college ON public.event_mimicry USING btree (college_id);


--
-- Name: idx_event_on_spot_painting_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_on_spot_painting_college ON public.event_on_spot_painting USING btree (college_id);


--
-- Name: idx_event_one_act_play_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_one_act_play_college ON public.event_one_act_play USING btree (college_id);


--
-- Name: idx_event_poster_making_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_poster_making_college ON public.event_poster_making USING btree (college_id);


--
-- Name: idx_event_quiz_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_quiz_college ON public.event_quiz USING btree (college_id);


--
-- Name: idx_event_rangoli_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_rangoli_college ON public.event_rangoli USING btree (college_id);


--
-- Name: idx_event_skits_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_skits_college ON public.event_skits USING btree (college_id);


--
-- Name: idx_event_spot_photography_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_spot_photography_college ON public.event_spot_photography USING btree (college_id);


--
-- Name: idx_event_western_vocal_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_western_vocal_college ON public.event_western_vocal_solo USING btree (college_id);


--
-- Name: idx_feedback_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_feedback_college ON public.feedback USING btree (college_id);


--
-- Name: idx_feedback_role; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_feedback_role ON public.feedback USING btree (role);


--
-- Name: idx_feedback_student; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_feedback_student ON public.feedback USING btree (student_id);


--
-- Name: idx_feedback_submitted; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_feedback_submitted ON public.feedback USING btree (submitted_at DESC);


--
-- Name: idx_feedback_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_feedback_user ON public.feedback USING btree (user_id);


--
-- Name: idx_fepm_phone; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fepm_phone ON public.final_event_participants_master USING btree (phone);


--
-- Name: idx_fepm_qr_code; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fepm_qr_code ON public.final_event_participants_master USING btree (qr_code);


--
-- Name: idx_final_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_final_college ON public.final_event_participants_master USING btree (college_id);


--
-- Name: idx_final_participants_accompanist_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_final_participants_accompanist_id ON public.final_event_participants_master USING btree (accompanist_id);


--
-- Name: idx_final_participants_college_person_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_final_participants_college_person_type ON public.final_event_participants_master USING btree (college_id, person_type);


--
-- Name: idx_final_participants_qr_code; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_final_participants_qr_code ON public.final_event_participants_master USING btree (qr_code);


--
-- Name: idx_final_participants_student_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_final_participants_student_id ON public.final_event_participants_master USING btree (student_id);


--
-- Name: idx_final_person_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_final_person_type ON public.final_event_participants_master USING btree (person_type);


--
-- Name: idx_final_qr; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_final_qr ON public.final_event_participants_master USING btree (qr_code);


--
-- Name: idx_payment_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_payment_college ON public.payment_receipts USING btree (college_id);


--
-- Name: idx_payment_session_expires; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_payment_session_expires ON public.payment_sessions USING btree (expires_at);


--
-- Name: idx_payment_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_payment_status ON public.payment_receipts USING btree (status);


--
-- Name: idx_payment_utr; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_payment_utr ON public.payment_receipts USING btree (utr_reference_number);


--
-- Name: idx_peml_admin; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_peml_admin ON public.principal_email_logs USING btree (triggered_by_admin_id);


--
-- Name: idx_peml_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_peml_college ON public.principal_email_logs USING btree (college_id);


--
-- Name: idx_peml_principal; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_peml_principal ON public.principal_email_logs USING btree (principal_user_id);


--
-- Name: idx_peml_sent_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_peml_sent_at ON public.principal_email_logs USING btree (sent_at DESC);


--
-- Name: idx_peml_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_peml_status ON public.principal_email_logs USING btree (status);


--
-- Name: idx_private_qr_pool_used; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_private_qr_pool_used ON public.private_qr_pool USING btree (is_used);


--
-- Name: idx_private_qr_pool_volunteer; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_private_qr_pool_volunteer ON public.private_qr_pool USING btree (assigned_to_volunteer_id);


--
-- Name: idx_qr_code; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_qr_code ON public.qr_code_pool USING btree (qr_code);


--
-- Name: idx_qr_unused; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_qr_unused ON public.qr_code_pool USING btree (is_used) WHERE (is_used = false);


--
-- Name: idx_reg_session_expires; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_reg_session_expires ON public.registration_sessions USING btree (expires_at);


--
-- Name: idx_settings_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_settings_key ON public.settings USING btree (setting_key);


--
-- Name: idx_student_applications_student_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_student_applications_student_id ON public.student_applications USING btree (student_id);


--
-- Name: idx_students_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_students_college ON public.students USING btree (college_id);


--
-- Name: idx_students_college_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_students_college_id ON public.students USING btree (college_id);


--
-- Name: idx_students_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_students_email ON public.students USING btree (email);


--
-- Name: idx_students_password_reset_expires; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_students_password_reset_expires ON public.students USING btree (password_reset_expires);


--
-- Name: idx_students_password_reset_token; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_students_password_reset_token ON public.students USING btree (password_reset_token);


--
-- Name: idx_students_phone; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_students_phone ON public.students USING btree (phone);


--
-- Name: idx_students_usn; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_students_usn ON public.students USING btree (usn);


--
-- Name: idx_temp_master_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_temp_master_college ON public.temp_event_participants_master USING btree (college_id);


--
-- Name: idx_temp_master_college_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_temp_master_college_type ON public.temp_event_participants_master USING btree (college_id, person_type);


--
-- Name: idx_temp_snapshot_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_temp_snapshot_college ON public.temp_event_participation_snapshot USING btree (college_id);


--
-- Name: idx_temp_snapshot_participant; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_temp_snapshot_participant ON public.temp_event_participation_snapshot USING btree (participant_id);


--
-- Name: idx_users_college; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_college ON public.users USING btree (college_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_vea_volunteer_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_vea_volunteer_id ON public.volunteer_event_assignments USING btree (volunteer_id);


--
-- Name: accommodation_allotments accommodation_allotments_allotted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accommodation_allotments
    ADD CONSTRAINT accommodation_allotments_allotted_by_fkey FOREIGN KEY (allotted_by) REFERENCES public.admins(id);


--
-- Name: accommodation_allotments accommodation_allotments_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accommodation_allotments
    ADD CONSTRAINT accommodation_allotments_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: accommodation_allotments accommodation_allotments_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accommodation_allotments
    ADD CONSTRAINT accommodation_allotments_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.accommodation_requests(id) ON DELETE CASCADE;


--
-- Name: accommodation_requests accommodation_requests_applied_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accommodation_requests
    ADD CONSTRAINT accommodation_requests_applied_by_user_id_fkey FOREIGN KEY (applied_by_user_id) REFERENCES public.users(id);


--
-- Name: accommodation_requests accommodation_requests_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accommodation_requests
    ADD CONSTRAINT accommodation_requests_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: accompanist_sessions accompanist_sessions_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accompanist_sessions
    ADD CONSTRAINT accompanist_sessions_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: accompanist_sessions accompanist_sessions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accompanist_sessions
    ADD CONSTRAINT accompanist_sessions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: accompanists accompanists_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accompanists
    ADD CONSTRAINT accompanists_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: accompanists accompanists_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accompanists
    ADD CONSTRAINT accompanists_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: accompanists accompanists_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accompanists
    ADD CONSTRAINT accompanists_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: admins admins_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admins(id);


--
-- Name: application_documents application_documents_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.application_documents
    ADD CONSTRAINT application_documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.student_applications(id) ON DELETE CASCADE;


--
-- Name: application_sessions application_sessions_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.application_sessions
    ADD CONSTRAINT application_sessions_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: application_sessions application_sessions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.application_sessions
    ADD CONSTRAINT application_sessions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: calendar_events calendar_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admins(id);


--
-- Name: da_broadcast_email_logs da_broadcast_email_logs_triggered_by_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.da_broadcast_email_logs
    ADD CONSTRAINT da_broadcast_email_logs_triggered_by_admin_id_fkey FOREIGN KEY (triggered_by_admin_id) REFERENCES public.admins(id);


--
-- Name: event_cartooning event_cartooning_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_cartooning
    ADD CONSTRAINT event_cartooning_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_cartooning event_cartooning_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_cartooning
    ADD CONSTRAINT event_cartooning_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_cartooning event_cartooning_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_cartooning
    ADD CONSTRAINT event_cartooning_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_cartooning event_cartooning_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_cartooning
    ADD CONSTRAINT event_cartooning_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_classical_dance_solo event_classical_dance_solo_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_dance_solo
    ADD CONSTRAINT event_classical_dance_solo_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_classical_dance_solo event_classical_dance_solo_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_dance_solo
    ADD CONSTRAINT event_classical_dance_solo_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_classical_dance_solo event_classical_dance_solo_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_dance_solo
    ADD CONSTRAINT event_classical_dance_solo_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_classical_dance_solo event_classical_dance_solo_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_dance_solo
    ADD CONSTRAINT event_classical_dance_solo_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_classical_instr_non_percussion event_classical_instr_non_percussion_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_instr_non_percussion
    ADD CONSTRAINT event_classical_instr_non_percussion_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_classical_instr_non_percussion event_classical_instr_non_percussion_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_instr_non_percussion
    ADD CONSTRAINT event_classical_instr_non_percussion_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_classical_instr_non_percussion event_classical_instr_non_percussion_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_instr_non_percussion
    ADD CONSTRAINT event_classical_instr_non_percussion_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_classical_instr_non_percussion event_classical_instr_non_percussion_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_instr_non_percussion
    ADD CONSTRAINT event_classical_instr_non_percussion_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_classical_instr_percussion event_classical_instr_percussion_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_instr_percussion
    ADD CONSTRAINT event_classical_instr_percussion_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_classical_instr_percussion event_classical_instr_percussion_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_instr_percussion
    ADD CONSTRAINT event_classical_instr_percussion_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_classical_instr_percussion event_classical_instr_percussion_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_instr_percussion
    ADD CONSTRAINT event_classical_instr_percussion_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_classical_instr_percussion event_classical_instr_percussion_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_instr_percussion
    ADD CONSTRAINT event_classical_instr_percussion_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_classical_vocal_solo event_classical_vocal_solo_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_vocal_solo
    ADD CONSTRAINT event_classical_vocal_solo_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_classical_vocal_solo event_classical_vocal_solo_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_vocal_solo
    ADD CONSTRAINT event_classical_vocal_solo_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_classical_vocal_solo event_classical_vocal_solo_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_vocal_solo
    ADD CONSTRAINT event_classical_vocal_solo_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_classical_vocal_solo event_classical_vocal_solo_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_classical_vocal_solo
    ADD CONSTRAINT event_classical_vocal_solo_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_clay_modelling event_clay_modelling_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_clay_modelling
    ADD CONSTRAINT event_clay_modelling_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_clay_modelling event_clay_modelling_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_clay_modelling
    ADD CONSTRAINT event_clay_modelling_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_clay_modelling event_clay_modelling_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_clay_modelling
    ADD CONSTRAINT event_clay_modelling_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_clay_modelling event_clay_modelling_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_clay_modelling
    ADD CONSTRAINT event_clay_modelling_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_collage_making event_collage_making_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_collage_making
    ADD CONSTRAINT event_collage_making_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_collage_making event_collage_making_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_collage_making
    ADD CONSTRAINT event_collage_making_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_collage_making event_collage_making_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_collage_making
    ADD CONSTRAINT event_collage_making_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_collage_making event_collage_making_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_collage_making
    ADD CONSTRAINT event_collage_making_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_debate event_debate_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_debate
    ADD CONSTRAINT event_debate_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_debate event_debate_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_debate
    ADD CONSTRAINT event_debate_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_debate event_debate_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_debate
    ADD CONSTRAINT event_debate_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_debate event_debate_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_debate
    ADD CONSTRAINT event_debate_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_elocution event_elocution_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_elocution
    ADD CONSTRAINT event_elocution_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_elocution event_elocution_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_elocution
    ADD CONSTRAINT event_elocution_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_elocution event_elocution_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_elocution
    ADD CONSTRAINT event_elocution_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_elocution event_elocution_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_elocution
    ADD CONSTRAINT event_elocution_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_folk_dance event_folk_dance_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_folk_dance
    ADD CONSTRAINT event_folk_dance_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_folk_dance event_folk_dance_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_folk_dance
    ADD CONSTRAINT event_folk_dance_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_folk_dance event_folk_dance_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_folk_dance
    ADD CONSTRAINT event_folk_dance_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_folk_dance event_folk_dance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_folk_dance
    ADD CONSTRAINT event_folk_dance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_folk_orchestra event_folk_orchestra_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_folk_orchestra
    ADD CONSTRAINT event_folk_orchestra_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_folk_orchestra event_folk_orchestra_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_folk_orchestra
    ADD CONSTRAINT event_folk_orchestra_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_folk_orchestra event_folk_orchestra_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_folk_orchestra
    ADD CONSTRAINT event_folk_orchestra_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_folk_orchestra event_folk_orchestra_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_folk_orchestra
    ADD CONSTRAINT event_folk_orchestra_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_group_song_indian event_group_song_indian_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_group_song_indian
    ADD CONSTRAINT event_group_song_indian_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_group_song_indian event_group_song_indian_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_group_song_indian
    ADD CONSTRAINT event_group_song_indian_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_group_song_indian event_group_song_indian_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_group_song_indian
    ADD CONSTRAINT event_group_song_indian_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_group_song_indian event_group_song_indian_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_group_song_indian
    ADD CONSTRAINT event_group_song_indian_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_group_song_western event_group_song_western_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_group_song_western
    ADD CONSTRAINT event_group_song_western_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_group_song_western event_group_song_western_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_group_song_western
    ADD CONSTRAINT event_group_song_western_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_group_song_western event_group_song_western_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_group_song_western
    ADD CONSTRAINT event_group_song_western_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_group_song_western event_group_song_western_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_group_song_western
    ADD CONSTRAINT event_group_song_western_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_installation event_installation_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_installation
    ADD CONSTRAINT event_installation_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_installation event_installation_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_installation
    ADD CONSTRAINT event_installation_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_installation event_installation_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_installation
    ADD CONSTRAINT event_installation_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_installation event_installation_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_installation
    ADD CONSTRAINT event_installation_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_light_vocal_solo event_light_vocal_solo_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_light_vocal_solo
    ADD CONSTRAINT event_light_vocal_solo_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_light_vocal_solo event_light_vocal_solo_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_light_vocal_solo
    ADD CONSTRAINT event_light_vocal_solo_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_light_vocal_solo event_light_vocal_solo_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_light_vocal_solo
    ADD CONSTRAINT event_light_vocal_solo_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_light_vocal_solo event_light_vocal_solo_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_light_vocal_solo
    ADD CONSTRAINT event_light_vocal_solo_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_mime event_mime_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_mime
    ADD CONSTRAINT event_mime_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_mime event_mime_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_mime
    ADD CONSTRAINT event_mime_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_mime event_mime_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_mime
    ADD CONSTRAINT event_mime_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_mime event_mime_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_mime
    ADD CONSTRAINT event_mime_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_mimicry event_mimicry_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_mimicry
    ADD CONSTRAINT event_mimicry_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_mimicry event_mimicry_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_mimicry
    ADD CONSTRAINT event_mimicry_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_mimicry event_mimicry_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_mimicry
    ADD CONSTRAINT event_mimicry_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_mimicry event_mimicry_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_mimicry
    ADD CONSTRAINT event_mimicry_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_on_spot_painting event_on_spot_painting_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_on_spot_painting
    ADD CONSTRAINT event_on_spot_painting_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_on_spot_painting event_on_spot_painting_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_on_spot_painting
    ADD CONSTRAINT event_on_spot_painting_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_on_spot_painting event_on_spot_painting_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_on_spot_painting
    ADD CONSTRAINT event_on_spot_painting_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_on_spot_painting event_on_spot_painting_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_on_spot_painting
    ADD CONSTRAINT event_on_spot_painting_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_one_act_play event_one_act_play_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_one_act_play
    ADD CONSTRAINT event_one_act_play_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_one_act_play event_one_act_play_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_one_act_play
    ADD CONSTRAINT event_one_act_play_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_one_act_play event_one_act_play_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_one_act_play
    ADD CONSTRAINT event_one_act_play_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_one_act_play event_one_act_play_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_one_act_play
    ADD CONSTRAINT event_one_act_play_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_participation_snapshot event_participation_snapshot_participant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_participation_snapshot
    ADD CONSTRAINT event_participation_snapshot_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.final_event_participants_master(id) ON DELETE CASCADE;


--
-- Name: event_poster_making event_poster_making_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_poster_making
    ADD CONSTRAINT event_poster_making_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_poster_making event_poster_making_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_poster_making
    ADD CONSTRAINT event_poster_making_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_poster_making event_poster_making_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_poster_making
    ADD CONSTRAINT event_poster_making_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_poster_making event_poster_making_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_poster_making
    ADD CONSTRAINT event_poster_making_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_quiz event_quiz_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_quiz
    ADD CONSTRAINT event_quiz_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_quiz event_quiz_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_quiz
    ADD CONSTRAINT event_quiz_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_quiz event_quiz_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_quiz
    ADD CONSTRAINT event_quiz_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_quiz event_quiz_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_quiz
    ADD CONSTRAINT event_quiz_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_rangoli event_rangoli_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_rangoli
    ADD CONSTRAINT event_rangoli_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_rangoli event_rangoli_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_rangoli
    ADD CONSTRAINT event_rangoli_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_rangoli event_rangoli_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_rangoli
    ADD CONSTRAINT event_rangoli_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_rangoli event_rangoli_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_rangoli
    ADD CONSTRAINT event_rangoli_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_skits event_skits_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_skits
    ADD CONSTRAINT event_skits_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_skits event_skits_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_skits
    ADD CONSTRAINT event_skits_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_skits event_skits_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_skits
    ADD CONSTRAINT event_skits_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_skits event_skits_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_skits
    ADD CONSTRAINT event_skits_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_spot_photography event_spot_photography_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_spot_photography
    ADD CONSTRAINT event_spot_photography_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_spot_photography event_spot_photography_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_spot_photography
    ADD CONSTRAINT event_spot_photography_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_spot_photography event_spot_photography_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_spot_photography
    ADD CONSTRAINT event_spot_photography_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_spot_photography event_spot_photography_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_spot_photography
    ADD CONSTRAINT event_spot_photography_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: event_western_vocal_solo event_western_vocal_solo_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_western_vocal_solo
    ADD CONSTRAINT event_western_vocal_solo_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: event_western_vocal_solo event_western_vocal_solo_attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_western_vocal_solo
    ADD CONSTRAINT event_western_vocal_solo_attendance_marked_by_fkey FOREIGN KEY (attendance_marked_by) REFERENCES public.volunteers(id);


--
-- Name: event_western_vocal_solo event_western_vocal_solo_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_western_vocal_solo
    ADD CONSTRAINT event_western_vocal_solo_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: event_western_vocal_solo event_western_vocal_solo_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_western_vocal_solo
    ADD CONSTRAINT event_western_vocal_solo_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: feedback feedback_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id) ON DELETE CASCADE;


--
-- Name: feedback feedback_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: feedback feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: final_event_participants_master final_event_participants_master_accompanist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.final_event_participants_master
    ADD CONSTRAINT final_event_participants_master_accompanist_id_fkey FOREIGN KEY (accompanist_id) REFERENCES public.accompanists(id) ON DELETE CASCADE;


--
-- Name: final_event_participants_master final_event_participants_master_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.final_event_participants_master
    ADD CONSTRAINT final_event_participants_master_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: final_event_participants_master final_event_participants_master_final_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.final_event_participants_master
    ADD CONSTRAINT final_event_participants_master_final_approved_by_fkey FOREIGN KEY (final_approved_by) REFERENCES public.users(id);


--
-- Name: final_event_participants_master final_event_participants_master_id_card_activated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.final_event_participants_master
    ADD CONSTRAINT final_event_participants_master_id_card_activated_by_fkey FOREIGN KEY (id_card_activated_by) REFERENCES public.volunteers(id);


--
-- Name: final_event_participants_master final_event_participants_master_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.final_event_participants_master
    ADD CONSTRAINT final_event_participants_master_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: green_room_allocations green_room_allocations_allocated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.green_room_allocations
    ADD CONSTRAINT green_room_allocations_allocated_by_fkey FOREIGN KEY (allocated_by) REFERENCES public.admins(id);


--
-- Name: green_room_allocations green_room_allocations_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.green_room_allocations
    ADD CONSTRAINT green_room_allocations_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: green_room_allocations green_room_allocations_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.green_room_allocations
    ADD CONSTRAINT green_room_allocations_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.green_room_requests(id);


--
-- Name: green_room_requests green_room_requests_applied_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.green_room_requests
    ADD CONSTRAINT green_room_requests_applied_by_user_id_fkey FOREIGN KEY (applied_by_user_id) REFERENCES public.users(id);


--
-- Name: green_room_requests green_room_requests_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.green_room_requests
    ADD CONSTRAINT green_room_requests_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: notifications notifications_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admins(id);


--
-- Name: payment_receipts payment_receipts_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: payment_receipts payment_receipts_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: payment_sessions payment_sessions_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_sessions
    ADD CONSTRAINT payment_sessions_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: principal_email_logs principal_email_logs_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.principal_email_logs
    ADD CONSTRAINT principal_email_logs_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id) ON DELETE CASCADE;


--
-- Name: principal_email_logs principal_email_logs_principal_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.principal_email_logs
    ADD CONSTRAINT principal_email_logs_principal_user_id_fkey FOREIGN KEY (principal_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: principal_email_logs principal_email_logs_triggered_by_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.principal_email_logs
    ADD CONSTRAINT principal_email_logs_triggered_by_admin_id_fkey FOREIGN KEY (triggered_by_admin_id) REFERENCES public.admins(id) ON DELETE SET NULL;


--
-- Name: private_qr_pool private_qr_pool_assigned_to_volunteer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.private_qr_pool
    ADD CONSTRAINT private_qr_pool_assigned_to_volunteer_id_fkey FOREIGN KEY (assigned_to_volunteer_id) REFERENCES public.volunteers(id) ON DELETE SET NULL;


--
-- Name: registration_sessions registration_sessions_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.registration_sessions
    ADD CONSTRAINT registration_sessions_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: settings_audit_logs settings_audit_logs_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings_audit_logs
    ADD CONSTRAINT settings_audit_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.admins(id);


--
-- Name: settings_audit_logs settings_audit_logs_setting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings_audit_logs
    ADD CONSTRAINT settings_audit_logs_setting_id_fkey FOREIGN KEY (setting_id) REFERENCES public.settings(id) ON DELETE CASCADE;


--
-- Name: settings settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admins(id);


--
-- Name: student_applications student_applications_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.student_applications
    ADD CONSTRAINT student_applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: students students_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: users users_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: volunteer_event_assignments volunteer_event_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.volunteer_event_assignments
    ADD CONSTRAINT volunteer_event_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.volunteers(id);


--
-- Name: volunteer_event_assignments volunteer_event_assignments_volunteer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.volunteer_event_assignments
    ADD CONSTRAINT volunteer_event_assignments_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE;


--
-- Name: volunteers volunteers_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict dfMiu8iZi2RD6sJkHsuuUFWUdSrrFgiIkfE0ysShnQfoJ7lcLtsVAVKobZNutXe

