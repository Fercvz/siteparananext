import json
import logging
import os
import uuid
from datetime import datetime
from pathlib import Path

import psycopg2
from psycopg2.extras import Json
from fastapi import FastAPI, HTTPException

from tse_scraper import fetch_tse_payload

logging.basicConfig(level=logging.INFO)

app = FastAPI()


def get_conn():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL nao configurado")
    return psycopg2.connect(database_url)


def ensure_source(conn, name: str, description: str):
    with conn.cursor() as cur:
        cur.execute(
            'INSERT INTO "DatasetSource" (id, name, description, "createdAt", "updatedAt") '
            'VALUES (%s, %s, %s, NOW(), NOW()) '
            'ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, "updatedAt" = NOW() '
            'RETURNING id',
            (str(uuid.uuid4()), name, description),
        )
        source_id = cur.fetchone()[0]
    conn.commit()
    return source_id


def create_run(conn, source_id: str, status: str):
    run_id = str(uuid.uuid4())
    with conn.cursor() as cur:
        cur.execute(
            'INSERT INTO "DatasetRun" (id, "sourceId", status, "startedAt") '
            'VALUES (%s, %s, %s, NOW())',
            (run_id, source_id, status),
        )
    conn.commit()
    return run_id


def finish_run(
    conn,
    run_id,
    status,
    logs,
    error_message,
):
    with conn.cursor() as cur:
        cur.execute(
            'UPDATE "DatasetRun" SET status = %s, "finishedAt" = NOW(), logs = %s, "errorMessage" = %s '
            'WHERE id = %s',
            (status, logs, error_message, run_id),
        )
    conn.commit()


def insert_record(conn, source_id: str, payload: dict):
    record_id = str(uuid.uuid4())
    with conn.cursor() as cur:
        cur.execute(
            'INSERT INTO "DatasetRecord" (id, "sourceId", "referenceDate", "payloadJson", "createdAt") '
            'VALUES (%s, %s, %s, %s, NOW())',
            (record_id, source_id, datetime.utcnow(), Json(payload)),
        )
    conn.commit()


def load_ibge_payload() -> dict:
    data_path = Path(__file__).parent / "data" / "cidades_pr.json"
    if not data_path.exists():
        raise RuntimeError("Arquivo cidades_pr.json nao encontrado")
    with data_path.open("r", encoding="utf-8") as file:
        return json.load(file)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/run/ibge")
def run_ibge():
    conn = get_conn()
    source_id = ensure_source(conn, "IBGE", "Dados municipais do Paraná (IBGE)")
    run_id = create_run(conn, source_id, "running")
    try:
        payload = load_ibge_payload()
        insert_record(conn, source_id, payload)
        finish_run(conn, run_id, "success", "IBGE atualizado", "")
        return {"status": "success", "source": "IBGE", "count": len(payload)}
    except Exception as exc:
        logging.exception("Falha no IBGE")
        finish_run(conn, run_id, "error", "", str(exc))
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        conn.close()


@app.post("/run/tse")
def run_tse():
    conn = get_conn()
    source_id = ensure_source(conn, "TSE", "Perfil do eleitorado do Paraná (TSE)")
    run_id = create_run(conn, source_id, "running")
    try:
        payload = fetch_tse_payload()
        insert_record(conn, source_id, payload)
        finish_run(conn, run_id, "success", "TSE atualizado", "")
        return {"status": "success", "source": "TSE", "count": len(payload)}
    except Exception as exc:
        logging.exception("Falha no TSE")
        finish_run(conn, run_id, "error", "", str(exc))
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        conn.close()


@app.post("/run/all")
def run_all():
    ibge = run_ibge()
    tse = run_tse()
    return {"status": "success", "ibge": ibge, "tse": tse}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
