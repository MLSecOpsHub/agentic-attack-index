// Build a deterministic STIX 2.1 bundle from incident records so the dataset can
// be ingested by SOC tooling (TIPs, MISP via the STIX import, etc.).
//
// Determinism: STIX object ids are UUIDv5 derived from stable inputs (the record
// id, a technique id, a CVE), so identical data yields a byte-identical bundle —
// no timestamps or randomness. Shared static objects use a fixed epoch.
import { createHash } from 'node:crypto';

// Namespace for deterministic STIX 2.1 ids (STIX 2.1 spec, section 1.9).
const STIX_NS = '00abedb4-aa42-466c-9c01-fed23315a9b7';
// Fixed created/modified for producer-static objects (identity, techniques, CVEs).
const EPOCH = '2020-01-01T00:00:00.000Z';

function uuid5(namespaceUuid, name) {
  const ns = Buffer.from(namespaceUuid.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(ns).update(Buffer.from(name, 'utf8')).digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

const stixId = (type, name) => `${type}--${uuid5(STIX_NS, `${type}:${name}`)}`;
const toTs = (isoDate) => `${isoDate}T00:00:00.000Z`;

// URL for a MITRE technique id, ATLAS (AML.*) or ATT&CK (T*, sub-techniques use /).
function techRef(id) {
  if (id.startsWith('AML.')) {
    return {
      source_name: 'mitre-atlas',
      external_id: id,
      url: `https://atlas.mitre.org/techniques/${id}`,
    };
  }
  return {
    source_name: 'mitre-attack',
    external_id: id,
    url: `https://attack.mitre.org/techniques/${id.replace('.', '/')}`,
  };
}

export function buildStixBundle(incidents) {
  const identityId = stixId('identity', 'MLSecOpsHub');
  const identity = {
    type: 'identity',
    spec_version: '2.1',
    id: identityId,
    created: EPOCH,
    modified: EPOCH,
    name: 'MLSecOpsHub — Agentic Attack Index',
    identity_class: 'organization',
  };

  const byId = new Map([[identity.id, identity]]); // dedup shared objects by id

  const ensureTechnique = (techId) => {
    const id = stixId('attack-pattern', techId);
    if (!byId.has(id)) {
      byId.set(id, {
        type: 'attack-pattern',
        spec_version: '2.1',
        id,
        created: EPOCH,
        modified: EPOCH,
        created_by_ref: identityId,
        name: techId,
        external_references: [techRef(techId)],
      });
    }
    return id;
  };

  const ensureVulnerability = (cve) => {
    const id = stixId('vulnerability', cve);
    if (!byId.has(id)) {
      byId.set(id, {
        type: 'vulnerability',
        spec_version: '2.1',
        id,
        created: EPOCH,
        modified: EPOCH,
        created_by_ref: identityId,
        name: cve,
        external_references: [
          { source_name: 'cve', external_id: cve, url: `https://nvd.nist.gov/vuln/detail/${cve}` },
        ],
      });
    }
    return id;
  };

  for (const inc of incidents) {
    const m = inc.mappings ?? {};
    const techniqueRefs = [...(m.mitre_atlas ?? []), ...(m.mitre_attack ?? [])].map(ensureTechnique);
    const vulnRefs = (m.cve ?? []).map(ensureVulnerability);

    const created = toTs(inc.added?.date ?? inc.date_disclosed);
    const modified = toTs(inc.last_updated ?? inc.date_disclosed);

    // Custom SDO carrying the incident's analytical fields — guarantees the report
    // always has ≥1 object_ref and lets consumers read the record inside STIX.
    const incidentSdoId = stixId('x-agentic-incident', inc.id);
    byId.set(incidentSdoId, {
      type: 'x-agentic-incident',
      spec_version: '2.1',
      id: incidentSdoId,
      created,
      modified,
      created_by_ref: identityId,
      name: inc.name,
      incident_ref_id: inc.id,
      category: inc.category,
      severity: inc.severity,
      grade_status: inc.status,
      confidence: inc.confidence,
      actor: inc.actor,
      actor_type: inc.actor_type,
      autonomy_level: inc.autonomy_level ?? null,
      ai_role: inc.ai_role ?? null,
      guardrail_bypass: inc.guardrail_bypass ?? [],
      model_families: inc.model_families ?? [],
      date_disclosed: inc.date_disclosed,
    });

    const sourceRefs = (inc.sources ?? []).map((s) => ({
      source_name: s.publisher,
      description: s.title,
      url: s.url,
    }));

    const reportId = stixId('report', inc.id);
    byId.set(reportId, {
      type: 'report',
      spec_version: '2.1',
      id: reportId,
      created,
      modified,
      created_by_ref: identityId,
      name: inc.name,
      report_types: ['threat-report'],
      published: toTs(inc.date_disclosed),
      description: inc.summary,
      labels: [inc.category, `status:${inc.status}`, `ai-role:${inc.ai_role ?? 'unknown'}`],
      object_refs: [incidentSdoId, ...techniqueRefs, ...vulnRefs],
      ...(sourceRefs.length ? { external_references: sourceRefs } : {}),
    });
  }

  // Sort objects by id for byte-stable output.
  const objects = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  return {
    type: 'bundle',
    id: `bundle--${uuid5(STIX_NS, 'bundle:agentic-attack-index')}`,
    objects,
  };
}
