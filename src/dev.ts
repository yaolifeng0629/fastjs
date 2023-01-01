export default {
  _dom: document || null,
  newWarn(send: string, warn: string, file?: Array<string>): void {
    // if in dev
    let output = `[Fastjs warn] ${send}: ${warn}`;
    if (file) {
      output += "\n";
      file.forEach((v) => {
        output += `   |-> ${v}\n`;
      });
    }
    // new warn
    console.warn(output);
  },
  newError(send: string, error: string, file?: Array<string>): void {
    // if in dev
    let output = `[Fastjs error] ${send}: ${error}`;
    if (file) {
      output += "\n";
      file.forEach((v) => {
        output += `   |-> ${v}\n`;
      });
    }
    // new error
    throw new Error(output);
  },
  type(arg: any): string {
    let type: string = typeof arg;
    if (type === "object") {
      if (arg instanceof Element) type = "Element";
      // if null
      else if (arg === null) type = "Null";
      else type = arg.constructor.name;
    }
    return type;
  },
};
