"""
Scraper TSE: baixa perfil do eleitorado e agrega por municipio do PR.
"""

import csv
import io
import unicodedata
import zipfile

import requests


PERFIL_URL = "https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitorado/perfil_eleitorado_2024.zip"


def normalize_key(name: str) -> str:
    if not name:
        return ""
    nfkd = unicodedata.normalize("NFKD", name)
    clean = "".join([c for c in nfkd if not unicodedata.combining(c)])
    return clean.lower().replace(" ", "_").replace("-", "_").replace("'", "")


def download_zip(url: str) -> bytes:
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    return resp.content


def process_perfil_eleitorado(csv_content: str):
    cidades = {}
    reader = csv.DictReader(io.StringIO(csv_content), delimiter=";")

    for row in reader:
        uf = row.get("SG_UF") or row.get("sg_uf") or row.get("UF") or row.get("uf")
        if not uf or uf.upper() != "PR":
            continue

        mun = (
            row.get("NM_MUNICIPIO")
            or row.get("nm_municipio")
            or row.get("MUNICIPIO")
            or row.get("municipio")
        )
        if not mun:
            continue

        key = normalize_key(mun.strip())
        if key not in cidades:
            cidades[key] = {
                "nome": mun.strip(),
                "total_eleitores": 0,
                "genero": {"masculino": 0, "feminino": 0, "nao_informado": 0},
                "faixa_etaria": {},
                "grau_instrucao": {},
                "estado_civil": {},
                "cor_raca": {},
            }

        qtd_col = (
            "QT_ELEITORES_PERFIL"
            if "QT_ELEITORES_PERFIL" in row
            else "QT_ELEITORES"
            if "QT_ELEITORES" in row
            else "qt_eleitores_perfil"
            if "qt_eleitores_perfil" in row
            else "qt_eleitores"
        )
        try:
            qtd = int(row.get(qtd_col, 0))
        except (TypeError, ValueError):
            qtd = 0

        cidades[key]["total_eleitores"] += qtd

        genero_col = (
            "DS_GENERO"
            if "DS_GENERO" in row
            else "ds_genero"
            if "ds_genero" in row
            else "GENERO"
            if "GENERO" in row
            else "genero"
        )
        genero_str = "N"
        if genero_col:
            genero = (row.get(genero_col) or "").upper()
            if "MASC" in genero:
                cidades[key]["genero"]["masculino"] += qtd
                genero_str = "M"
            elif "FEM" in genero:
                cidades[key]["genero"]["feminino"] += qtd
                genero_str = "F"
            else:
                cidades[key]["genero"]["nao_informado"] += qtd

        faixa_col = (
            "DS_FAIXA_ETARIA"
            if "DS_FAIXA_ETARIA" in row
            else "ds_faixa_etaria"
            if "ds_faixa_etaria" in row
            else "FAIXA_ETARIA"
            if "FAIXA_ETARIA" in row
            else "faixa_etaria"
        )
        faixa = (row.get(faixa_col) or "").strip()
        if faixa:
            if faixa not in cidades[key]["faixa_etaria"]:
                cidades[key]["faixa_etaria"][faixa] = {"M": 0, "F": 0, "N": 0}
            cidades[key]["faixa_etaria"][faixa][genero_str] += qtd

        instrucao_col = (
            "DS_GRAU_ESCOLARIDADE"
            if "DS_GRAU_ESCOLARIDADE" in row
            else "ds_grau_escolaridade"
            if "ds_grau_escolaridade" in row
            else "GRAU_INSTRUCAO"
            if "GRAU_INSTRUCAO" in row
            else "grau_instrucao"
        )
        instrucao = (row.get(instrucao_col) or "").strip()
        if instrucao:
            cidades[key]["grau_instrucao"][instrucao] = (
                cidades[key]["grau_instrucao"].get(instrucao, 0) + qtd
            )

        civil_col = (
            "DS_ESTADO_CIVIL"
            if "DS_ESTADO_CIVIL" in row
            else "ds_estado_civil"
            if "ds_estado_civil" in row
            else "ESTADO_CIVIL"
            if "ESTADO_CIVIL" in row
            else "estado_civil"
        )
        civil = (row.get(civil_col) or "").strip()
        if civil:
            cidades[key]["estado_civil"][civil] = (
                cidades[key]["estado_civil"].get(civil, 0) + qtd
            )

        cor_col = (
            "DS_COR_RACA"
            if "DS_COR_RACA" in row
            else "ds_cor_raca"
            if "ds_cor_raca" in row
            else "COR_RACA"
            if "COR_RACA" in row
            else "cor_raca"
        )
        cor = (row.get(cor_col) or "").strip()
        if cor:
            cidades[key]["cor_raca"][cor] = (
                cidades[key]["cor_raca"].get(cor, 0) + qtd
            )

    return cidades


def convert_to_percentages(cidades: dict) -> dict:
    for cidade in cidades.values():
        total = cidade.get("total_eleitores", 0)
        if total == 0:
            continue

        for key in cidade["genero"]:
            cidade["genero"][key] = round((cidade["genero"][key] / total) * 100, 1)

        for faixa in cidade["faixa_etaria"]:
            cidade["faixa_etaria"][faixa]["M"] = round(
                (cidade["faixa_etaria"][faixa]["M"] / total) * 100, 2
            )
            cidade["faixa_etaria"][faixa]["F"] = round(
                (cidade["faixa_etaria"][faixa]["F"] / total) * 100, 2
            )
            cidade["faixa_etaria"][faixa]["N"] = round(
                (cidade["faixa_etaria"][faixa]["N"] / total) * 100, 2
            )

        for instrucao in cidade["grau_instrucao"]:
            cidade["grau_instrucao"][instrucao] = round(
                (cidade["grau_instrucao"][instrucao] / total) * 100, 1
            )

        for civil in cidade["estado_civil"]:
            cidade["estado_civil"][civil] = round(
                (cidade["estado_civil"][civil] / total) * 100, 1
            )

        for cor in cidade["cor_raca"]:
            cidade["cor_raca"][cor] = round(
                (cidade["cor_raca"][cor] / total) * 100, 1
            )

    return cidades


def fetch_tse_payload() -> dict:
    zip_bytes = download_zip(PERFIL_URL)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zip_ref:
        csv_name = next(
            (name for name in zip_ref.namelist() if name.lower().endswith(".csv")),
            None,
        )
        if not csv_name:
            raise RuntimeError("CSV do TSE nao encontrado no zip.")
        csv_content = zip_ref.read(csv_name).decode("latin-1")

    cidades = process_perfil_eleitorado(csv_content)
    return convert_to_percentages(cidades)
