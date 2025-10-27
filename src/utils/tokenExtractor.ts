export const tokenExtractor = (authorizationHeader: string): string => {
    if (!authorizationHeader) return '';
    return authorizationHeader.replace('Bearer ', '').trim();
};