import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applicationSchema } from "../applications";

describe("applicationSchema", () => {
  const validInput = {
    company_name: "Acme Corp",
    job_title: "Software Engineer",
    job_type: "Full-time" as const,
    status: "Applied" as const,
    applied_date: "2026-06-18",
  };

  it("accepts valid input", () => {
    const result = applicationSchema.parse(validInput);
    assert.equal(result.company_name, "Acme Corp");
    assert.equal(result.job_title, "Software Engineer");
    assert.equal(result.job_type, "Full-time");
    assert.equal(result.status, "Applied");
    assert.equal(result.applied_date, "2026-06-18");
    assert.equal(result.notes, undefined);
  });

  it("accepts valid input with optional notes", () => {
    const result = applicationSchema.parse({ ...validInput, notes: "Some notes here" });
    assert.equal(result.notes, "Some notes here");
  });

  it("accepts null notes", () => {
    const result = applicationSchema.parse({ ...validInput, notes: null });
    assert.equal(result.notes, null);
  });

  it("rejects empty company_name", () => {
    assert.throws(() => applicationSchema.parse({ ...validInput, company_name: "" }), /Company name/);
  });

  it("rejects company_name shorter than 2 characters", () => {
    assert.throws(() => applicationSchema.parse({ ...validInput, company_name: "A" }), /Company name/);
  });

  it("rejects missing job_title", () => {
    assert.throws(() => applicationSchema.parse({ ...validInput, job_title: "" }), /Job title/);
  });

  it("rejects invalid job_type", () => {
    assert.throws(() => applicationSchema.parse({ ...validInput, job_type: "Invalid" }));
  });

  it("rejects invalid status", () => {
    assert.throws(() => applicationSchema.parse({ ...validInput, status: "Unknown" }));
  });

  it("rejects empty applied_date", () => {
    assert.throws(() => applicationSchema.parse({ ...validInput, applied_date: "" }), /date/);
  });

  it("trims whitespace from company_name", () => {
    const result = applicationSchema.parse({ ...validInput, company_name: "  Acme Corp  " });
    assert.equal(result.company_name, "Acme Corp");
  });

  it("enforces max length of 120 on company_name", () => {
    assert.throws(() => applicationSchema.parse({ ...validInput, company_name: "A".repeat(121) }));
  });
});
