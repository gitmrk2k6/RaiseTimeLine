package com.raisetimeline.mapper;

import com.raisetimeline.entity.Like;
import org.apache.ibatis.annotations.*;

@Mapper
public interface LikeMapper {

    @Insert("INSERT INTO likes (post_id, user_id) VALUES (#{postId}, #{userId})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(Like like);

    @Delete("DELETE FROM likes WHERE post_id = #{postId} AND user_id = #{userId}")
    void delete(@Param("postId") Long postId, @Param("userId") Long userId);

    @Select("SELECT COUNT(*) FROM likes WHERE post_id = #{postId}")
    long countByPostId(Long postId);

    @Select("SELECT COUNT(*) > 0 FROM likes WHERE post_id = #{postId} AND user_id = #{userId}")
    boolean existsByPostIdAndUserId(@Param("postId") Long postId, @Param("userId") Long userId);
}
