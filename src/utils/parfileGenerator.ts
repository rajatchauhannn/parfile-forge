import { type ParfileConfig } from "../types";

export const generateParfileContent = (config: ParfileConfig): string => {
  const params = [];
  const {
    userid,
    credential,
    directory,
    dumpfile,
    logfile,
    abort_step,
    keep_master,
    access_method,
    logtime,
    logtime_tz,
    disable_cluster,
    parallel,
    job_name,
    metrics,
    version,
    include,
    exclude,
    operation,
    // Export specific
    compression,
    compression_algorithm,
    transport_full_check,
    source_edition,
    encryption_mode,
    encryption_algorithm,
    views_as_tables,
    encryption_password,
    content,
    query,
    sample,
    filesize,
    flashback_time,
    flashback_scn,
    estimate_only,
    estimate,
    reuse_dumpfiles,
    export_mode,
    schemas,
    tables,
    tablespaces,
    // Import specific
    table_exists_action,
    transport_datafiles,
    partition_options,
    master_only,
    skip_unusable_indexes,
    disable_streams_configuration,
    data_options_skip_constraints,
    data_options_xml_validation,
    import_mode,
    remap_data,
    remap_container,
    remap_table,
    remap_schema,
    remap_tablespace,
    remap_datafile,
    sqlfile,
    transform,
    network_link,
  } = config;

  const isNetworkImport = operation === "IMPORT" && !!network_link;

  // --- General Parameters ---
  if (userid) {
    params.push(
      userid.match(/[\s/@]/) ? `USERID='${userid}'` : `USERID=${userid}`
    );
  }
  if (job_name) params.push(`JOB_NAME=${job_name}`);
  if (metrics) params.push(`METRICS=Y`);
  if (logtime) {
    params.push("LOGTIME=ALL");
    if (logtime_tz) {
      params.push("LOGTIME_TZ=Y");
    }
  }
  if (abort_step && abort_step > 0) {
    params.push(`ABORT_STEP=${abort_step}`);
  }
  if (access_method && access_method !== "AUTOMATIC") {
    params.push(`ACCESS_METHOD=${access_method}`);
  }
  if (keep_master) {
    params.push("KEEP_MASTER=Y");
  }
  if (compression?.includes("ENCRYPTED")) {
    params.push(`ENCRYPTION_ALGORITHM=${encryption_algorithm}`);
    params.push(`ENCRYPTION_MODE=${encryption_mode}`);
    // The password is only added if the mode requires it.
    if (encryption_mode !== "TRANSPARENT" && encryption_password) {
      params.push(`ENCRYPTION_PASSWORD=${encryption_password}`);
    }
  }

  // DIRECTORY and DUMPFILE are skipped for network imports
  if (!isNetworkImport) {
    if (credential) {
      params.push(`CREDENTIAL=${credential}`);
    } else if (directory) {
      params.push(`DIRECTORY=${directory}`);
    }

    if (dumpfile) {
      // For cloud, the dumpfile might be a full URL
      // We need to check if it needs quotes
      const needsQuotes = dumpfile.includes("?") || dumpfile.includes("&");
      params.push(
        needsQuotes ? `DUMPFILE='${dumpfile}'` : `DUMPFILE=${dumpfile}`
      );
    }
  }

  if (logfile) params.push(`LOGFILE=${logfile}`);
  if (parallel && parallel > 1) params.push(`PARALLEL=${parallel}`);
  if (version) params.push(`VERSION=${version}`);
  if (disable_cluster) params.push("CLUSTER=N");
  if (include) params.push(`INCLUDE=${include}`);
  if (exclude) params.push(`EXCLUDE=${exclude}`);

  // --- Operation-Specific Parameters ---
  if (operation === "EXPORT") {
    if (export_mode === "TRANSPORTABLE_PDB") {
      params.push("TRANSPORTABLE=ALWAYS");
    } else if (export_mode === "SCHEMAS" && schemas)
      params.push(`SCHEMAS=${schemas}`);
    else if (export_mode === "TABLES" && tables)
      params.push(`TABLES=${tables}`);
    else if (export_mode === "TABLESPACES" && tablespaces)
      params.push(`TABLESPACES=${tablespaces}`);
    else if (export_mode === "TRANSPORTABLE_TABLESPACES" && tablespaces)
      params.push(`TRANSPORTABLE_TABLESPACES=${tablespaces}`);
    else if (export_mode === "FULL") params.push("FULL=Y");

    if (compression && compression !== "NONE") {
      params.push(`COMPRESSION=${compression}`);
      if (["ALL", "DATA_ONLY"].includes(compression) && compression_algorithm) {
        // Check if compression_algorithm is truthy
        params.push(`COMPRESSION_ALGORITHM=${compression_algorithm}`);
      }
    }
    if (content) params.push(`CONTENT=${content}`);
    if (query) params.push(`QUERY=${query}`);
    if (sample) params.push(`SAMPLE=${sample}`);
    if (flashback_time) params.push(`FLASHBACK_TIME="${flashback_time}"`);
    else if (flashback_scn) params.push(`FLASHBACK_SCN=${flashback_scn}`);
    if (estimate_only === "YES") {
      params.push("ESTIMATE_ONLY=YES");
      params.push(`ESTIMATE=${estimate}`);
    }
    if (reuse_dumpfiles === "Y") params.push("REUSE_DUMPFILES=Y");
    if (filesize) params.push(`FILESIZE=${filesize}`);
    if (transport_full_check && export_mode === "TRANSPORTABLE_TABLESPACES") {
      params.push("TRANSPORT_FULL_CHECK=Y");
    }
    if (source_edition) params.push(`SOURCE_EDITION=${source_edition}`);
    if (views_as_tables) {
      views_as_tables
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .forEach((line) => {
          params.push(`VIEWS_AS_TABLES=${line.trim()}`);
        });
    }
  } else if (operation === "IMPORT") {
    // These parameters apply to all import modes
    if (schemas) params.push(`SCHEMAS=${schemas}`);
    if (table_exists_action)
      params.push(`TABLE_EXISTS_ACTION=${table_exists_action}`);
    const dataOptionsFlags = [];
    if (data_options_skip_constraints) {
      dataOptionsFlags.push("SKIP_CONSTRAINT_ERRORS");
    }
    if (data_options_xml_validation === "VALIDATE") {
      dataOptionsFlags.push("XML_VALIDATE");
    } else if (data_options_xml_validation === "DISABLE") {
      dataOptionsFlags.push("DISABLE_XML_VALIDATE");
    }

    if (dataOptionsFlags.length > 0) {
      params.push(`DATA_OPTIONS=${dataOptionsFlags.join(",")}`);
    }
    if (partition_options)
      params.push(`PARTITION_OPTIONS=${partition_options}`);
    if (skip_unusable_indexes) params.push(`SKIP_UNUSABLE_INDEXES=Y`);
    if (disable_streams_configuration) params.push("STREAMS_CONFIGURATION=N");
    if (master_only) params.push("MASTER_ONLY=Y");
    if (sqlfile) params.push(`SQLFILE=${sqlfile}`);
    if (transform) params.push(`TRANSFORM=${transform}`);
    if (remap_data) params.push(`REMAP_DATA=${remap_data}`);
    if (network_link) params.push(`NETWORK_LINK=${network_link}`);

    // Mode-specific remapping
    if (import_mode === "TRANSPORTABLE") {
      if (transport_datafiles)
        params.push(`TRANSPORT_DATAFILES=${transport_datafiles}`);
      if (remap_datafile) params.push(`REMAP_DATAFILE=${remap_datafile}`);
    } else {
      // Standard mode
      if (remap_schema) params.push(`REMAP_SCHEMA=${remap_schema}`);
      if (remap_tablespace) params.push(`REMAP_TABLESPACE=${remap_tablespace}`);
      if (remap_container) params.push(`REMAP_CONTAINER=${remap_container}`);
      if (remap_table) {
        remap_table
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .forEach((line) => {
            params.push(`REMAP_TABLE=${line.trim()}`);
          });
      }
    }
  }

  return params.join("\n");
};

export const generateCommand = (config: ParfileConfig): string => {
  const opCommand = config.operation === "EXPORT" ? "expdp" : "impdp";

  const parfileLines = generateParfileContent(config)
    .split("\n")
    .filter((line) => line.length > 0);
  const commandParams = parfileLines.map((line) => {
    const i = line.indexOf("=");
    if (i === -1) return line;
    const key = line.substring(0, i);
    const value = line.substring(i + 1);

    if (key === "USERID" || key === "QUERY" || key === "FLASHBACK_TIME") {
      const strippedValue = value.replace(/^['"]|['"]$/g, "");
      return `${key}='${strippedValue}'`;
    }
    return line;
  });
  return `nohup ${opCommand} ${commandParams.join(" ")} &`;
};
