/**
 * This is an adaptation of Chen-Yu Ho's handwriting.js library.
 * It provides a simple API wrapper around Google's Input Tools handwriting recognition.
 */

export interface HandwritingOptions {
  language?: string;
  numOfReturn?: number;
}

export type Stroke = [number[], number[], number[]]; // [x_array, y_array, time_array]
export type Trace = Stroke[];

export async function recognizeHandwriting(
  traces: Trace,
  options: HandwritingOptions = {},
): Promise<string[]> {
  const language = options.language || "ja";
  const numOfReturn = options.numOfReturn || 10;

  if (!traces || traces.length === 0) {
    return [];
  }

  const payload = {
    options: "enable_pre_space",
    requests: [
      {
        writing_guide: {
          writing_area_width: 10000,
          writing_area_height: 10000,
        },
        ink: traces,
        language: language,
      },
    ],
  };

  try {
    const response = await fetch(
      "https://inputtools.google.com/request?itc=" +
        language +
        "-t-i0-handwrit&app=handwriting.js",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (
      data &&
      data[0] === "SUCCESS" &&
      data[1] &&
      data[1][0] &&
      data[1][0][1]
    ) {
      let results: string[] = data[1][0][1];
      if (results.length > numOfReturn) {
        results = results.slice(0, numOfReturn);
      }
      return results;
    }

    return [];
  } catch (error) {
    console.error("Handwriting Recognition Error:", error);
    return [];
  }
}
