import { getPinnedReference } from '.';

describe('Chapter 2', () => {
  describe('getPinnedReference', () => {
    it('should work with version range', async () => {
      expect.assertions(1);
      const pinnedReference = await getPinnedReference({
        name: 'react',
        reference: '~15.3.0'
      });
      expect(pinnedReference).toEqual({ name: 'react', reference: '15.3.2' });
    });
  });

  it('should work with pinned version', async () => {
    expect.assertions(1);
    const pinnedReference = await getPinnedReference({
      name: 'react',
      reference: '15.3.0'
    });
    expect(pinnedReference).toEqual({ name: 'react', reference: '15.3.0' });
  });

  it('should work with path', async () => {
    expect.assertions(1);
    const pinnedReference = await getPinnedReference({
      name: 'react',
      reference: '/tmp/react-15.3.2.tar.gz'
    });
    expect(pinnedReference).toEqual({
      name: 'react',
      reference: '/tmp/react-15.3.2.tar.gz'
    });
  });
});
