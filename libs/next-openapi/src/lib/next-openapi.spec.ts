import { nextOpenapi } from './next-openapi';

describe('nextOpenapi', () => {
  it('should work', async () => {
    expect(await nextOpenapi()); //.toEqual('next-openapi');
  });
});
