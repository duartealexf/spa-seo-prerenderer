export interface PrerendererResponse {
  /**
   * Rendered HTML.
   */
  body: string;

  /**
   * Headers from Prerenderer.
   */
  headers: {
    status: number;
    'X-Prerendered-Ms': number;
    [header: string]: string | number;
  };
}

/**
 * Prerenderer responses mapped by requested URL.
 */
export const Responses: Map<string, PrerendererResponse> = new Map<string, PrerendererResponse>();
