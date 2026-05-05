package com.raisetimeline.mapper;

import com.raisetimeline.dto.UserResponse;
import com.raisetimeline.entity.Follow;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface FollowMapper {

    @Insert("INSERT INTO follows (follower_id, following_id) VALUES (#{followerId}, #{followingId})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(Follow follow);

    @Delete("DELETE FROM follows WHERE follower_id = #{followerId} AND following_id = #{followingId}")
    void delete(@Param("followerId") Long followerId, @Param("followingId") Long followingId);

    @Select("SELECT COUNT(*) FROM follows WHERE following_id = #{userId}")
    long countFollowers(@Param("userId") Long userId);

    @Select("SELECT COUNT(*) > 0 FROM follows WHERE follower_id = #{followerId} AND following_id = #{followingId}")
    boolean exists(@Param("followerId") Long followerId, @Param("followingId") Long followingId);

    List<UserResponse> findFollowers(
            @Param("userId") Long userId,
            @Param("currentUserId") Long currentUserId);

    List<UserResponse> findFollowing(
            @Param("userId") Long userId,
            @Param("currentUserId") Long currentUserId);
}
