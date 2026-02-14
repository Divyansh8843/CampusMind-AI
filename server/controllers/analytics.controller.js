export const savePerformance = async (req, res) => {
  await Performance.create({
    user: req.user.id,
    topic: req.body.topic,
    score: req.body.score,
    time: req.body.time,
  });
  res.send({ success: true });
};
